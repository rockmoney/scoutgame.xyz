import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendDiscordEvent } from '@packages/discord/sendDiscordEvent';
import { authSecret, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '@packages/utils/constants';
import { GET as httpGET, POST as httpPOST } from '@packages/utils/http';
import { unsealData } from 'iron-session';

export async function setupBuilderProfile({ code, state }: { code: string; state: string }) {
  const clientId = GITHUB_CLIENT_ID;
  const clientSecret = GITHUB_CLIENT_SECRET;

  if (!state) {
    throw new Error('Invalid connection url');
  }

  const unsealedUserId = await unsealData<{ id: string }>(state, { password: authSecret as string }).then(
    (data) => data?.id as string
  );

  if (!unsealedUserId) {
    throw new Error('User required');
  }

  const scout = await prisma.scout.findUnique({
    where: {
      id: unsealedUserId
    }
  });

  if (!scout) {
    throw new Error('User not found');
  }

  const tokenData = await httpPOST<{ access_token: string }>(
    `https://github.com/login/oauth/access_token`,
    {
      client_id: clientId,
      client_secret: clientSecret,
      code
    },
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    }
  );

  const accessToken = tokenData.access_token;

  if (!accessToken) {
    log.warn('Failed to authenticate Github account', {
      code,
      tokenData
    });
    throw new Error('Failed to authenticate Github account');
  }

  // Fetch the GitHub user's info
  const apiGithubUser = await httpGET<{ login: string; name: string; email: string; id: number }>(
    'https://api.github.com/user',
    undefined,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  const githubLogin = apiGithubUser.login;

  if (!githubLogin) {
    throw new Error('Failed to fetch Github user');
  }

  const githubUser = await prisma.githubUser.findFirst({
    where: {
      id: apiGithubUser.id
    }
  });

  // handle existing github user tied to a different builder
  if (githubUser?.builderId && githubUser.builderId !== unsealedUserId) {
    log.warn('Github user already in use', {
      githubLogin,
      userId: unsealedUserId
    });
    throw new Error('Account is already in use');
  }

  log.info('Connecting github profile to new builder', {
    githubLogin,
    alreadyExists: !!githubUser,
    displayName: apiGithubUser.name,
    id: apiGithubUser.id,
    userId: unsealedUserId
  });

  await prisma.githubUser.upsert({
    where: {
      id: apiGithubUser.id
    },
    create: {
      builderId: unsealedUserId,
      login: githubLogin,
      displayName: apiGithubUser.name,
      email: apiGithubUser.email,
      id: apiGithubUser.id
    },
    update: {
      builderId: unsealedUserId,
      login: githubLogin // in case this has changed
    }
  });

  // mark builder as applied if they haven't been marked as such yet
  if (scout.builderStatus === null) {
    await prisma.scout.update({
      where: {
        id: unsealedUserId
      },
      data: {
        builderStatus: 'applied',
        onboardedAt: new Date()
      }
    });
    await sendDiscordEvent({
      title: '🎉 Developer Applied',
      description: `Developer ${scout.displayName} has applied`,
      fields: [{ name: 'Profile', value: `https://scoutgame.xyz/u/${scout.path}` }]
    });
  } else if (scout.builderStatus === 'rejected') {
    await prisma.scout.update({
      where: {
        id: unsealedUserId
      },
      data: {
        builderStatus: 'applied',
        reappliedAt: new Date()
      }
    });
    log.info(`Developer reapplied`, {
      userId: unsealedUserId
    });
  } else {
    log.info(`Developer already applied: ${scout.builderStatus}`, {
      userId: unsealedUserId
    });
  }

  return scout;
}
