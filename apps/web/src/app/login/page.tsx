import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import LoginForm from './login-form';
import Logo from '@/components/logo';

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');

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
        <LoginForm />
      </div>
    </div>
  );
}
