import { env } from '../../config/env';

export function isAllowedUser(userId: number): boolean {
  if (!env.TELEGRAM\_ALLOWED\_USER\_IDS.length) {
    return false;
  }
  return env.TELEGRAM\_ALLOWED\_USER\_IDS.includes(userId);
}
