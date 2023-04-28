import { prisma } from '@charmverse/core';

export async function updateProposlsDraftStatus() {
  const updated = await prisma.proposal.updateMany({
    where: {
      status: 'private_draft' as any
    },
    data: {
      status: 'draft',
    },
  });

  console.log('🔥 udpated:', updated);
}

updateProposlsDraftStatus();
