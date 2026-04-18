import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

const ROLE_BADGE: Record<string, { label: string; colours: string }> = {
  admin:      { label: 'Admin',      colours: 'bg-violet-100 text-violet-700 ring-violet-300' },
  dispatcher: { label: 'Dispatcher', colours: 'bg-blue-100 text-blue-700 ring-blue-300' },
  engineer:   { label: 'Engineer',   colours: 'bg-emerald-100 text-emerald-700 ring-emerald-300' },
};

interface PageProps {
  searchParams: Promise<{ invited?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { invited } = await searchParams;
  const users = await adminApi.users.list();

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Users" />

      <main className="p-6">
        {invited && (
          <div className="mb-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            Invite sent — the user will receive an email to set their password.
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{users.length} user{users.length !== 1 ? 's' : ''}</p>
          <Link
            href="/engineers/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Invite User
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clock Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Job</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const badge = ROLE_BADGE[user.role] ?? ROLE_BADGE['engineer']!;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link
                          href={`/engineers/${user.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {user.firstName} {user.lastName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-600">{user.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge.colours}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {user.role === 'engineer' ? (
                          <span className="inline-flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${user.clockedIn ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span className={user.clockedIn ? 'text-green-700' : 'text-gray-500'}>
                              {user.clockedIn ? 'Clocked in' : 'Clocked out'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-gray-600">
                        {user.currentOrderId ? (
                          <Link
                            href={`/service-orders/${user.currentOrderId}`}
                            className="text-blue-600 hover:underline font-mono text-xs"
                          >
                            {user.currentOrderRef ?? user.currentOrderId}
                          </Link>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
