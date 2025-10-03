import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/manage-address/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div className='text-center text-6xl font-bold'>주소 관리 페이지입니다.</div>;
}
