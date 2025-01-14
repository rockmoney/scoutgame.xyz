import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from '@packages/utils/strings';
import { sendPointsForMiscEvent } from '@packages/scoutgame/points/builderEvents/sendPointsForMiscEvent';
import { getCurrentSeasonStart } from 'packages/dates/src/utils';
async function query() {
  const scout = await prisma.scout.findMany({
    where: { path: 'loocapro' },
    select: {
      builderNfts: {
        where: {
          season: getCurrentSeasonStart()
        },
        select: {
          nftSoldEvents: {
            select: {
              scoutId: true,
              tokensPurchased: true
            }
          }
        }
      }
    }
    // include: {
    //   nftPurchaseEvents: {
    //     select: {
    //       pointsValue: true,
    //       tokensPurchased: true,
    //       builderNFT: {
    //         select: {
    //           builder: {
    //             select: {
    //               displayName: true,
    //               path: true
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // }
  });
  prettyPrint(scout);
  // await sendPointsForMiscEvent({
  //   builderId: scout!.id,
  //   points: 50,
  //   claimed: true,
  //   description: 'Refund for suspended builders: futreall and mdqst',
  //   hideFromNotifications: true,
  //   earnedAs: 'scout'
  // });
}

query();
