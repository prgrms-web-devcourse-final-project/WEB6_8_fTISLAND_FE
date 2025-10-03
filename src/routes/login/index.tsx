import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div className='text-center text-6xl font-bold'>로그인 페이지입니다.</div>;
}
