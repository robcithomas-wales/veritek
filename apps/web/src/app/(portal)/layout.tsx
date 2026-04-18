import { getUser } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import Sidebar from '@/components/sidebar';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await getUser();
  const me = await adminApi.users.me();

  return (
    <div className="flex min-h-screen">
      <Sidebar user={me} />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
