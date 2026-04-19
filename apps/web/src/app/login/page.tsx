import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LoginForm from './login-form';
import Logo from '@/components/logo';

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');

  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-700">
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Logo height={56} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Veritek Back Office</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to the operations portal</p>
        </div>
        {error === 'access_denied' && (
          <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            Your account does not have access to the back office portal. Please sign in with a dispatcher or admin account.
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
