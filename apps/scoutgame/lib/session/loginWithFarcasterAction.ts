'use server';

import { actionClient } from 'lib/actions/actionClient';
import { findOrCreateFarcasterUser } from 'lib/farcaster/findOrCreateFarcasterUser';
import { verifyFarcasterUser } from 'lib/farcaster/verifyFarcasterUser';

import { authSchema } from '../farcaster/config';

import { saveSession } from './saveSession';

export const loginAction = actionClient
  .metadata({ actionName: 'login_with_farcaster' })
  .schema(authSchema)
  .action(async ({ ctx, parsedInput }) => {
    const { fid } = await verifyFarcasterUser(parsedInput);
    const user = await findOrCreateFarcasterUser({ fid });

    await saveSession(ctx, { user });

    return { success: true, userId: user.id };
  });
