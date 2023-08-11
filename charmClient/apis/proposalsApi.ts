import type { PageWithPermissions } from '@charmverse/core/pages';
import type {
  ProposalCategoryWithPermissions,
  ProposalFlowPermissionFlags,
  ProposalReviewerPool
} from '@charmverse/core/permissions';
import type { Page, ProposalRubricCriteriaAnswer, ProposalStatus } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';

import * as http from 'adapters/http';
import type { PageWithProposal } from 'lib/pages';
import type { ArchiveProposalRequest } from 'lib/proposal/archiveProposal';
import type { CreateProposalInput } from 'lib/proposal/createProposal';
import type { CreateProposalFromTemplateInput } from 'lib/proposal/createProposalFromTemplate';
import type { ListProposalsRequest } from 'lib/proposal/getProposalsBySpace';
import type { RubricProposalsUserInfo } from 'lib/proposal/getProposalsEvaluatedByUser';
import type { ProposalCategory, ProposalWithUsersAndRubric } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';

export class ProposalsApi {
  deleteRubricCriteriaAnswer({ proposalId, rubricCriteriaId }: { proposalId: string; rubricCriteriaId: string }) {
    return http.PUT<ProposalRubricCriteriaAnswer>(`/api/proposals/${proposalId}/rubric-answers`, { rubricCriteriaId });
  }

  createProposal(input: Omit<CreateProposalInput, 'userId'>) {
    return http.POST<PageWithProposal>('/api/proposals', input);
  }

  updateProposal({ proposalId, ...rest }: UpdateProposalRequest) {
    return http.PUT<PageWithProposal>(`/api/proposals/${proposalId}`, rest);
  }

  getProposal(proposalId: string) {
    return http.GET<ProposalWithUsersAndRubric>(`/api/proposals/${proposalId}`);
  }

  updateStatus(proposalId: string, newStatus: ProposalStatus) {
    return http.PUT<ProposalWithUsers>(`/api/proposals/${proposalId}/status`, { newStatus });
  }

  getProposalsBySpace({ spaceId, categoryIds }: ListProposalsRequest) {
    return http.GET<ProposalWithUsers[]>(`/api/spaces/${spaceId}/proposals`, { categoryIds });
  }

  getProposalTemplatesBySpace({ spaceId }: { spaceId: string }) {
    return http.GET<(ProposalWithUsers & { page: Page })[]>(`/api/spaces/${spaceId}/proposal-templates`);
  }

  getProposalCategories(spaceId: string) {
    return http.GET<ProposalCategoryWithPermissions[]>(`/api/spaces/${spaceId}/proposal-categories`);
  }

  getProposalIdsEvaluatedByUser(spaceId: string) {
    return http.GET<RubricProposalsUserInfo>(`/api/spaces/${spaceId}/proposals-evaluated-by-user`);
  }

  archiveProposal({ archived, proposalId }: ArchiveProposalRequest) {
    return http.POST<ProposalWithUsers>(`/api/proposals/${proposalId}/archive`, { archived });
  }

  createProposalTemplate({
    spaceId,
    categoryId
  }: {
    spaceId: string;
    categoryId: string;
  }): Promise<PageWithPermissions> {
    return http.POST('/api/proposals/templates', { spaceId, categoryId });
  }

  createProposalFromTemplate({
    spaceId,
    templateId
  }: Omit<CreateProposalFromTemplateInput, 'createdBy'>): Promise<PageWithPermissions> {
    return http.POST('/api/proposals/from-template', { spaceId, templateId });
  }

  deleteProposalTemplate({ proposalTemplateId }: { proposalTemplateId: string }): Promise<PageWithPermissions> {
    return http.DELETE(`/api/proposals/templates/${proposalTemplateId}`);
  }

  createProposalCategory(spaceId: string, category: Omit<ProposalCategory, 'id' | 'spaceId'>) {
    return http.POST<ProposalCategoryWithPermissions>(`/api/spaces/${spaceId}/proposal-categories`, { ...category });
  }

  updateProposalCategory(spaceId: string, category: ProposalCategory) {
    return http.PUT<ProposalCategoryWithPermissions>(`/api/spaces/${spaceId}/proposal-categories/${category.id}`, {
      ...category
    });
  }

  deleteProposalCategory(spaceId: string, categoryId: string) {
    return http.DELETE<{ ok: true }>(`/api/spaces/${spaceId}/proposal-categories/${categoryId}`);
  }

  computeProposalFlowPermissions(proposalId: string) {
    return http.GET<ProposalFlowPermissionFlags>(`/api/proposals/${proposalId}/compute-flow-flags`);
  }

  getReviewerPool(proposalId: string) {
    return http.GET<ProposalReviewerPool>(`/api/proposals/reviewer-pool?resourceId=${proposalId}`);
  }

  getAllReviewerUserIds(proposalId: string) {
    return http.GET<string[]>(`/api/proposals/${proposalId}/get-user-reviewerids`);
  }
}
