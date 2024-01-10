import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Page, ProposalReviewer, ProposalStatus } from '@charmverse/core/prisma';
import type { Prisma, ProposalEvaluation } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers, ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { arrayUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { FieldAnswerInput, FormFieldInput } from 'components/common/form/interfaces';
import { createForm } from 'lib/form/createForm';
import { upsertProposalFormAnswers } from 'lib/form/upsertProposalFormAnswers';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { createPage } from 'lib/pages/server/createPage';
import type { ProposalFields } from 'lib/proposal/interface';

import { getPagePath } from '../pages';

import type { VoteSettings } from './interface';
import type { RubricDataInput } from './rubric/upsertRubricCriteria';
import { upsertRubricCriteria } from './rubric/upsertRubricCriteria';

type PageProps = Partial<
  Pick<
    Page,
    'title' | 'content' | 'contentText' | 'sourceTemplateId' | 'headerImage' | 'icon' | 'type' | 'autoGenerated'
  >
>;

export type ProposalEvaluationInput = Pick<ProposalEvaluation, 'id' | 'index' | 'title' | 'type'> & {
  reviewers: Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];
  rubricCriteria: RubricDataInput[];
  permissions?: WorkflowEvaluationJson['permissions']; // pass these in to override workflow defaults
  voteSettings?: VoteSettings | null;
};

export type CreateProposalInput = {
  pageId?: string;
  pageProps?: PageProps;
  proposalTemplateId?: string | null;
  authors?: string[];
  userId: string;
  spaceId: string;
  evaluations: ProposalEvaluationInput[];
  publishToLens?: boolean;
  fields?: ProposalFields | null;
  workflowId?: string;
  formFields?: FormFieldInput[];
  formAnswers?: FieldAnswerInput[];
  formId?: string;
  isDraft?: boolean;
};

export type CreatedProposal = {
  page: PageWithPermissions;
  proposal: ProposalWithUsers;
};

export async function createProposal({
  userId,
  spaceId,
  pageProps,
  authors,
  evaluations = [],
  publishToLens,
  fields,
  workflowId,
  formId,
  formFields,
  formAnswers,
  isDraft
}: CreateProposalInput) {
  const proposalId = uuid();
  const proposalStatus: ProposalStatus = isDraft ? 'draft' : 'published';

  const authorsList = arrayUtils.uniqueValues(authors ? [...authors, userId] : [userId]);

  const workflow = workflowId
    ? ((await prisma.proposalWorkflow.findUnique({
        where: {
          id: workflowId
        }
      })) as ProposalWorkflowTyped | null)
    : null;

  const evaluationIds = evaluations.map(() => uuid());

  const evaluationPermissionsToCreate: Prisma.ProposalEvaluationPermissionCreateManyInput[] = [];

  const reviewersInput: Prisma.ProposalReviewerCreateManyInput[] = [];

  // retrieve permissions and apply evaluation ids to reviewers
  if (evaluations.length > 0) {
    // TODO: fix tests that need to pass in permissions
    evaluations.forEach(({ id: evaluationId, permissions: providedPermissions, reviewers: evalReviewers }, index) => {
      const configuredEvaluation = workflow?.evaluations[index];
      const permissions = configuredEvaluation?.permissions || providedPermissions;
      if (!permissions) {
        throw new Error(
          `Cannot find permissions for evaluation step. Workflow: ${workflowId}. Evaluation: ${evaluationId}`
        );
      }
      evaluationPermissionsToCreate.push(
        ...permissions.map((permission) => ({
          evaluationId: evaluationIds[index],
          operation: permission.operation,
          systemRole: permission.systemRole
        }))
      );
      reviewersInput.push(
        ...evalReviewers.map((reviewer) => ({
          roleId: reviewer.roleId,
          systemRole: reviewer.systemRole,
          userId: reviewer.userId,
          proposalId,
          evaluationId: evaluationIds[index]
        }))
      );
    });
  }

  let proposalFormId = formId;
  // Always create new form for proposal templates
  if (formFields?.length && pageProps?.type === 'proposal_template') {
    proposalFormId = await createForm(formFields);
  }

  for (const evaluation of evaluations) {
    if (evaluation.reviewers.length === 0 && evaluation.type !== 'feedback') {
      throw new Error('No reviewers defined for proposal evaluation step');
    }
  }

  // Using a transaction to ensure both the proposal and page gets created together
  const [proposal, _reviewerCreation, _evaluationPermissions, page] = await prisma.$transaction([
    prisma.proposal.create({
      data: {
        // Add page creator as the proposal's first author
        createdBy: userId,
        id: proposalId,
        space: { connect: { id: spaceId } },
        status: proposalStatus,
        publishToLens,
        authors: {
          createMany: {
            data: authorsList.map((author) => ({ userId: author }))
          }
        },
        evaluations: {
          createMany: {
            data: evaluations.map((evaluation, index) => ({
              id: evaluationIds[index],
              voteSettings: evaluation.voteSettings || undefined,
              index: evaluation.index,
              title: evaluation.title,
              type: evaluation.type
            }))
          }
        },
        fields: fields as any,
        workflow: workflowId
          ? {
              connect: {
                id: workflowId
              }
            }
          : undefined,
        form: proposalFormId ? { connect: { id: proposalFormId } } : undefined
      },
      include: {
        authors: true
      }
    }),
    prisma.proposalReviewer.createMany({
      data: reviewersInput
    }),
    prisma.proposalEvaluationPermission.createMany({
      data: pageProps?.type === 'proposal_template' ? [] : evaluationPermissionsToCreate
    }),
    createPage({
      data: {
        autoGenerated: pageProps?.autoGenerated ?? false,
        content: pageProps?.content ?? undefined,
        createdBy: userId,
        contentText: pageProps?.contentText ?? '',
        headerImage: pageProps?.headerImage,
        icon: pageProps?.icon,
        id: proposalId,
        path: getPagePath(),
        proposalId,
        sourceTemplateId: pageProps?.sourceTemplateId,
        title: pageProps?.title ?? '',
        type: pageProps?.type ?? 'proposal',
        updatedBy: userId,
        spaceId
      }
    })
  ]);

  const createdReviewers = await prisma.proposalReviewer.findMany({
    where: { proposalId: proposal.id }
  });

  trackUserAction('new_proposal_created', { userId, pageId: page.id, resourceId: proposal.id, spaceId });

  await Promise.all(
    evaluations.map(async (evaluation, index) => {
      if (evaluation.rubricCriteria?.length > 0) {
        await upsertRubricCriteria({
          evaluationId: evaluationIds[index],
          proposalId: proposal.id,
          rubricCriteria: evaluation.rubricCriteria
        });
      }
    })
  );

  const proposalFormFields = proposal.formId
    ? await prisma.formField.findMany({ where: { formId: proposal.formId } })
    : null;

  const proposalFormAnswers =
    formId && formAnswers?.length && page.type === 'proposal'
      ? await upsertProposalFormAnswers({ formId, proposalId, answers: formAnswers })
      : null;

  return {
    page: page as PageWithPermissions,
    proposal: {
      ...proposal,
      reviewers: createdReviewers,
      draftRubricAnswers: [],
      rubricAnswers: [],
      formFields: proposalFormFields,
      formAnswers: proposalFormAnswers
    }
  };
}
