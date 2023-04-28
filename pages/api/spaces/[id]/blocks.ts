import { prisma } from '@charmverse/core';
import type { Page } from '@charmverse/core/dist/prisma';
import type { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';

import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).get(getBlocks);

async function getBlocks(req: NextApiRequest, res: NextApiResponse<Page[]>) {
  const pages = await prisma.page.findMany({
    where: {
      spaceId: req.query.id as string
    }
  });
  return res.status(200).json(pages);
}

export default withSessionRoute(handler);
