import { BuilderNftType, prisma } from '@charmverse/core/prisma-client';

import { getCurrentSeasonStart } from '../dates/utils';

export type BuilderSearchResult = {
  id: string;
  path: string;
  displayName: string;
  avatar: string | null;
  seasonPoints: number;
  allTimePoints: number;
  scoutedBy: number;
  price: number;
};

export async function searchBuilders({
  search,
  limit = 10
}: {
  search: string;
  limit?: number;
}): Promise<BuilderSearchResult[]> {
  const season = getCurrentSeasonStart();
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      OR: [
        {
          path: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          displayName: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ],
      deletedAt: null
    },
    take: limit,
    orderBy: {
      // Sort by similarity to the query
      _relevance: {
        fields: ['path', 'displayName'],
        search,
        sort: 'desc'
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true,
      avatar: true,
      userSeasonStats: {
        where: {
          season
        },
        select: {
          pointsEarnedAsBuilder: true
        }
      },
      builderNfts: {
        where: {
          season,
          nftType: BuilderNftType.default
        },
        select: {
          currentPrice: true,
          nftSoldEvents: {
            distinct: ['scoutId']
          }
        }
      },
      userAllTimeStats: {
        select: {
          pointsEarnedAsBuilder: true
        }
      }
    }
  });

  return builders.map((builder) => ({
    id: builder.id,
    path: builder.path,
    displayName: builder.displayName!,
    avatar: builder.avatar,
    seasonPoints: builder.userSeasonStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    allTimePoints: builder.userAllTimeStats?.[0]?.pointsEarnedAsBuilder ?? 0,
    scoutedBy: builder.builderNfts?.[0]?.nftSoldEvents?.length ?? 0,
    price: Number(builder.builderNfts?.[0]?.currentPrice ?? 0)
  }));
}
