import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';
import { PriorityBadge } from '@/components/ui/badge';

export default async function DispatchPage() {
  const [ordersResult, engineers] = await Promise.all([
    adminApi.serviceOrders.list({ status: 'received', pageSize: 50 }),
    adminApi.users.list({ role: 'engineer' }),
  ]);

  const unassigned = ordersResult.data.filter((o) => !o.engineerName);

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Dispatch" />

      <main className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: unassigned orders */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Unassigned Orders
              <span className="ml-2 bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {unassigned.length}
              </span>
            </h2>

            {unassigned.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center text-sm text-gray-400">
                No unassigned received orders
              </div>
            ) : (
              <div className="space-y-3">
                {unassigned.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={order.priority} />
                        <span className="font-medium text-gray-900 text-sm">{order.reference}</span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{order.siteName}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Link
                      href={`/service-orders/${order.id}`}
                      className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Assign
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right: engineer roster */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Engineers
              <span className="ml-2 bg-gray-200 text-gray-700 rounded-full px-2 py-0.5 text-xs font-bold">
                {engineers.length}
              </span>
            </h2>

            {engineers.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm text-center text-sm text-gray-400">
                No engineers found
              </div>
            ) : (
              <div className="space-y-3">
                {engineers.map((engineer) => (
                  <div key={engineer.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
                    {/* Clock status dot */}
                    <div
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        engineer.clockedIn ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={engineer.clockedIn ? 'Clocked in' : 'Not clocked in'}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {engineer.firstName} {engineer.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{engineer.email}</p>
                      {engineer.currentOrderId ? (
                        <p className="text-xs text-orange-600 mt-0.5">
                          On job:{' '}
                          <Link
                            href={`/service-orders/${engineer.currentOrderId}`}
                            className="hover:underline"
                          >
                            {engineer.currentOrderId}
                          </Link>
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {engineer.clockedIn ? 'Available' : 'Not clocked in'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
