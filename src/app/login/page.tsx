import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();

  if (session?.user) {
    redirect('/dashboard');
  }

  const { error } = await searchParams;

  return <LoginForm error={error} />;
}
