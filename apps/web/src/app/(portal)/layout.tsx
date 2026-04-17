import { getUser } from '@/lib/auth';
import Sidebar from '@/components/sidebar';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await getUser();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}
