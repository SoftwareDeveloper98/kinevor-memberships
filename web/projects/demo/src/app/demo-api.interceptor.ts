import { HttpInterceptorFn } from '@angular/common/http';

const MEMBER_STORAGE_KEY = 'kinevor-memberships-demo-member';
const DEFAULT_MEMBER_ID = '11111111-1111-1111-1111-111111111111';

/**
 * Adds the demo trust headers so the standalone host can authenticate requests.
 * The linked member defaults to Maya Thompson and can be changed in the shell.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/')) return next(req);

  const memberId = localStorage.getItem(MEMBER_STORAGE_KEY) ?? DEFAULT_MEMBER_ID;

  return next(
    req.clone({
      setHeaders: {
        'X-Demo-Role': 'Member',
        'X-Demo-Email': 'maya.thompson@kinevor.local',
        'X-Demo-Member': memberId,
      },
    }),
  );
};
