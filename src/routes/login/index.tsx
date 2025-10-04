import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LoginForm } from './_components/LoginForm';

export const Route = createFileRoute('/login/')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  return (
    <LoginForm
      onSubmit={(values) => {
        console.log('login submit', values);
      }}
      onSignup={() => {
        navigate({ to: '/signup' });
      }}
    />
  );
}
