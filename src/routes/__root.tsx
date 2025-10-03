import { Outlet, createRootRoute } from '@tanstack/react-router';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className='flex min-h-[100dvh] w-full justify-center bg-[#f1f5f9] text-[#1b1b1b]'>
      <main className='flex w-full min-h-[100dvh] flex-col bg-transparent sm:mx-auto sm:max-w-[28rem] md:max-w-[32rem] lg:max-w-[36rem]'>
        <Outlet />
      </main>
    </div>
  );
}
