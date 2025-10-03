import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div className='text-center text-6xl font-bold'>Root 페이지입니다.</div>;
}
