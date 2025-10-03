import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(dashboard)/rider/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>라이더 프로필 페이지입니다!</div>;
}
