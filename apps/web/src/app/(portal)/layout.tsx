import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import Sidebar from '@/components/sidebar';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await getUser();

  let me;
  try {
    me = await adminApi.users.me();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('403')) redirect('/login?error=access_denied');
    throw err;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={me} />
      <div className="flex-1 flex flex-col min-w-0 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  );
}
