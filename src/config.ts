// src/config/site.json, or the test fixture profile (see astro.config.mjs).
import profile from '@site/profile';

export interface FriendLink { alias: string; name: string; url: string; description?: string; }
export interface SocialLink { name: string; url: string; }

export const site: Omit<typeof profile, 'socials'> & { socials: SocialLink[] } = profile;
export const friends: FriendLink[] = site.friends;
