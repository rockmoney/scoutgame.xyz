'use server';

import { log } from '@charmverse/core/log';
import { actionClient } from '@packages/scoutgame/actions/actionClient';
import { findOrCreateFarcasterUser } from '@packages/scoutgame/users/findOrCreateFarcasterUser';
import { authSecret } from '@packages/utils/constants';
import { sealData } from 'iron-session';
import { cookies } from 'next/headers';

import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';

import { authSchema } from '../farcaster/config';

import { saveSession } from './saveSession';

export const loginWithFarcasterAction = actionClient
  .metadata({ actionName: 'login_with_farcaster' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);

    if (parsedInput.inviteCode) {
      cookies().set(
        'invite-code',
        await sealData({ inviteCode: parsedInput.inviteCode }, { password: authSecret as string })
      );
      log.info(`Builder logged in with invite code: ${parsedInput.inviteCode}`, { fid });
    }

    const user = await findOrCreateFarcasterUser({ fid, referralCode: parsedInput.referralCode });
    await saveSession(ctx, { scoutId: user.id });

    return { success: true, userId: user.id, onboarded: !!user.onboardedAt, user };
  });
