import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/signup/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div className='text-center text-6xl font-bold'>회원가입 페이지입니다.</div>;
}
