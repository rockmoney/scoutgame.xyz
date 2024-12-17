import { sendGemsPayoutEmails } from '../emails/sendGemsPayoutEmails/sendGemsPayoutEmails';
import { prisma } from '@charmverse/core/prisma-client';

export async function query() {
  await sendGemsPayoutEmails({
    week: '2024-W42'
  });
  const scout = await prisma.scout.findFirstOrThrow({
    where: {
      path: 'felipe.cremin89'
    },
    select: {
      farcasterId: true,
      id: true
    }
  });
}
query();
