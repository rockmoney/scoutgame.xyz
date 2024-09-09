import { baseUrl } from '@root/config/constants';
import { getFrameHtml } from 'frames.js';

import { joinWaitlist } from 'lib/frame/actionButtons';

export type JoinWaitlistHomeProps = {
  referrerFid: string;
};

export function JoinWaitlistFrame({ referrerFid }: JoinWaitlistHomeProps) {
  return getFrameHtml({
    image: `${baseUrl}/images/waitlist/waitlist-intro.gif`,
    ogImage: `${baseUrl}/images/waitlist/waitlist-intro.gif`,
    version: 'vNext',
    imageAspectRatio: '1:1',
    buttons: [joinWaitlist({ referrerFid })]
  });
}
