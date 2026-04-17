import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

export default async function EngineersPage() {
  const engineers = await adminApi.users.list({ role: 'engineer' });

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Engineers" />

      <main className="p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clock Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Job</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {engineers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                    No engineers found
                  </td>
                </tr>
              ) : (
                engineers.map((engineer) => (
                  <tr key={engineer.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-5 py-3">
                      <Link
                        href={`/engineers/${engineer.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {engineer.firstName} {engineer.lastName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{engineer.email}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            engineer.clockedIn ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        />
                        <span className={engineer.clockedIn ? 'text-green-700' : 'text-gray-500'}>
                          {engineer.clockedIn ? 'Clocked in' : 'Clocked out'}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {engineer.currentOrderId ? (
                        <Link
                          href={`/service-orders/${engineer.currentOrderId}`}
                          className="text-blue-600 hover:underline font-mono text-xs"
                        >
                          {engineer.currentOrderId}
                        </Link>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
