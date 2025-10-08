import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('auth');
      const parsed = raw ? JSON.parse(raw) : null;
      const state = parsed?.state ?? parsed;
      const token = state?.accessToken as string | undefined;
      const profile = state?.currentActiveProfileType as 'CUSTOMER' | 'SELLER' | 'RIDER' | undefined;
      if (!token) {
        throw redirect({ to: '/login' });
      }
      switch (profile) {
        case 'CUSTOMER':
          throw redirect({ to: '/customer' });
        case 'SELLER':
          throw redirect({ to: '/seller' });
        case 'RIDER':
          throw redirect({ to: '/rider' });
        default:
          throw redirect({ to: '/customer' });
      }
    } catch {
      throw redirect({ to: '/login' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return null;
}
