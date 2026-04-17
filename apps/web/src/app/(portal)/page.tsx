import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';

function priorityLabel(p: number): string {
  if (p < 20) return 'LOW';
  if (p < 40) return 'MEDIUM';
  if (p < 60) return 'HIGH';
  if (p < 80) return 'CRITICAL';
  return 'URGENT';
}

const STATUS_LABELS: Record<string, string> = {
  received:    'Received',
  accepted:    'Accepted',
  in_route:    'In Route',
  in_progress: 'In Progress',
  completed:   'Completed',
  closed:      'Closed',
};

export default async function DashboardPage() {
  const stats = await adminApi.serviceOrders.stats();

  const openStatuses = ['received', 'accepted', 'in_route', 'in_progress'];
  const totalOpen = openStatuses.reduce(
    (sum, s) => sum + (stats.byStatus[s] ?? 0),
    0,
  );
  const inProgress = stats.byStatus['in_progress'] ?? 0;

  const priorityBands = [
    { label: 'LOW',      min: 0,  max: 19 },
    { label: 'MEDIUM',   min: 20, max: 39 },
    { label: 'HIGH',     min: 40, max: 59 },
    { label: 'CRITICAL', min: 60, max: 79 },
    { label: 'URGENT',   min: 80, max: 100 },
  ];

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Dashboard" />

      <main className="p-6 space-y-8">
        {/* KPI row */}
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Open" value={totalOpen} colour="blue" />
            <KpiCard label="In Progress" value={inProgress} colour="orange" />
            <KpiCard label="SLA At Risk" value={stats.slaAtRisk} colour="red" />
            <KpiCard label="Engineers Clocked In" value={stats.engineersClockedIn} colour="green" />
          </div>
        </section>

        {/* Status + Priority breakdowns */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Status breakdown */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              By Status
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {openStatuses.map((status) => (
                <Link
                  key={status}
                  href={`/service-orders?status=${status}`}
                  className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group"
                >
                  <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {stats.byStatus[status] ?? 0}
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={status} />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Priority breakdown */}
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              By Priority
            </h2>
            <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
              {priorityBands.map(({ label, min }) => {
                const count = stats.byPriority[label] ?? stats.byPriority[label.toLowerCase()] ?? 0;
                return (
                  <div key={label} className="flex items-center justify-between px-5 py-3">
                    <PriorityBadge priority={min} />
                    <span className="text-lg font-semibold text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Recent completions */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Recent Completions
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Engineer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recentlyCompleted.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                      No completed orders yet
                    </td>
                  </tr>
                ) : (
                  stats.recentlyCompleted.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <Link href={`/service-orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                          {order.reference}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-gray-700">{order.siteName}</td>
                      <td className="px-5 py-3 text-gray-700">{order.engineerName ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(order.updatedAt).toLocaleString('en-GB', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function KpiCard({
  label,
  value,
  colour,
}: {
  label: string;
  value: number;
  colour: 'blue' | 'orange' | 'red' | 'green';
}) {
  const colourClasses: Record<typeof colour, string> = {
    blue:   'text-blue-600',
    orange: 'text-orange-500',
    red:    'text-red-600',
    green:  'text-green-600',
  };
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-4xl font-bold ${colourClasses[colour]}`}>{value}</p>
    </div>
  );
}
