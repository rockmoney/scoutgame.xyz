import 'server-only';

import { getBuilderActivities } from '@packages/scoutgame/builders/getBuilderActivities';
import { getBuilderCardStats } from '@packages/scoutgame/builders/getBuilderCardStats';
import { getBuilderNft } from '@packages/scoutgame/builders/getBuilderNft';
import { getBuilderScouts } from '@packages/scoutgame/builders/getBuilderScouts';
import { getBuilderStats } from '@packages/scoutgame/builders/getBuilderStats';
import type { ScoutProjectMinimal } from '@packages/scoutgame/projects/getUserScoutProjects';
import { countStarterPackTokensPurchased } from '@packages/scoutgame/scouts/countStarterPackTokensPurchased';

import type { BuilderProfileProps } from './PublicBuilderProfileContainer';
import { PublicBuilderProfileContainer } from './PublicBuilderProfileContainer';

export async function PublicBuilderProfile({
  builder,
  scoutId,
  scoutProjects
}: {
  builder: BuilderProfileProps['builder'];
  scoutId?: string;
  scoutProjects?: ScoutProjectMinimal[];
}) {
  const builderId = builder.id;

  const [
    defaultNft,
    starterPackNft,
    { allTimePoints = 0, seasonPoints = 0, rank = 0, gemsCollected = 0 },
    builderActivities,
    { scouts = [], totalNftsSold = 0, totalScouts = 0 },
    { level, estimatedPayout, last14DaysRank, nftsSoldToScout, starterPackSoldToScout },
    { remaining: remainingStarterCards }
  ] = await Promise.all([
    getBuilderNft(builderId),
    getBuilderNft(builderId, 'starter_pack'),
    getBuilderStats(builderId),
    getBuilderActivities({ builderId, limit: 200 }),
    getBuilderScouts(builderId),
    getBuilderCardStats({ builderId, scoutId }),
    countStarterPackTokensPurchased(scoutId)
  ]);

  return (
    <PublicBuilderProfileContainer
      scouts={scouts}
      builder={{
        ...builder,
        gemsCollected,
        nftsSoldToScout,
        last14DaysRank: last14DaysRank ?? [],
        level: level ?? 0,
        estimatedPayout: estimatedPayout ?? 0
      }}
      starterPackSoldToScout={starterPackSoldToScout}
      defaultNft={defaultNft}
      starterPackNft={remainingStarterCards > 0 ? starterPackNft : null}
      allTimePoints={allTimePoints}
      seasonPoints={seasonPoints}
      totalScouts={totalScouts}
      totalNftsSold={totalNftsSold}
      builderActivities={builderActivities}
      gemsCollected={gemsCollected}
      rank={rank}
      scoutProjects={scoutProjects}
    />
  );
}
