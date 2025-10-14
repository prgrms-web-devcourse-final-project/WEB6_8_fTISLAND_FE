import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/store/auth';
import { useNotificationsSSE } from '@/lib/useNotificationsSSE';
import './index.css';

import { routeTree } from './routeTree.gen';

// Some third-party libs (e.g., SockJS) may reference `global` in the browser.
// Provide a minimal shim to avoid "global is not defined" at runtime.
if (typeof (window as any).global === 'undefined') {
  (window as any).global = window;
}

const router = createRouter({ routeTree });
const queryClient = new QueryClient();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  function NotificationsBootstrap() {
    const { userId } = useAuthStore();
    useNotificationsSSE(userId ? `web-${userId}` : undefined);
    return null;
  }
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <NotificationsBootstrap />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>
  );
}
