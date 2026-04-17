import { createSupabaseServerClient } from '@/lib/supabase/server';
import SignOutButton from './sign-out-button';

interface HeaderProps { title: string }

export default async function Header({ title }: HeaderProps) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.email}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
