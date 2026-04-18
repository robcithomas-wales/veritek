import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

const STATUS_META: Record<string, { label: string; colour: string; dot: string }> = {
  received:    { label: 'Received',    colour: 'bg-slate-50 border-slate-300',   dot: 'bg-slate-400' },
  accepted:    { label: 'Accepted',    colour: 'bg-blue-50 border-blue-300',     dot: 'bg-blue-500' },
  in_route:    { label: 'In Route',    colour: 'bg-violet-50 border-violet-300', dot: 'bg-violet-500' },
  in_progress: { label: 'In Progress', colour: 'bg-amber-50 border-amber-300',   dot: 'bg-amber-500' },
};

const PRIORITY_META: Record<string, { label: string; bar: string; text: string }> = {
  low:      { label: 'Low',      bar: 'bg-slate-400',  text: 'text-slate-600' },
  medium:   { label: 'Medium',   bar: 'bg-blue-400',   text: 'text-blue-600' },
  high:     { label: 'High',     bar: 'bg-amber-400',  text: 'text-amber-600' },
  critical: { label: 'Critical', bar: 'bg-red-500',    text: 'text-red-600' },
};

export default async function DashboardPage() {
  const [stats, allUsers] = await Promise.all([
    adminApi.serviceOrders.stats(),
    adminApi.users.list({ role: 'engineer' }),
  ]);

  const openStatuses = ['received', 'accepted', 'in_route', 'in_progress'];
  const totalOpen = openStatuses.reduce((sum, s) => sum + (stats.byStatus[s] ?? 0), 0);
  const inProgress = stats.byStatus['in_progress'] ?? 0;
  const unassigned = stats.byStatus['received'] ?? 0;

  const clockedInEngineers = allUsers.filter((u) => u.clockedIn);
  const priorityTotal = Object.values(stats.byPriority as Record<string, number>).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <Header title="Dashboard" />

      <main className="p-6 space-y-6">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Open Orders"
            value={totalOpen}
            icon={<OrdersIcon />}
            bg="from-blue-500 to-blue-600"
            href="/service-orders"
          />
          <KpiCard
            label="In Progress"
            value={inProgress}
            icon={<WrenchIcon />}
            bg="from-amber-500 to-amber-600"
            href="/service-orders?status=in_progress"
          />
          <KpiCard
            label="SLA At Risk"
            value={stats.slaAtRisk}
            icon={<ClockAlertIcon />}
            bg={stats.slaAtRisk > 0 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'}
            href="/service-orders"
          />
          <KpiCard
            label="Clocked In"
            value={stats.engineersClockedIn}
            icon={<EngineerIcon />}
            bg="from-violet-500 to-violet-600"
            href="/engineers"
          />
        </div>

        {/* Needs dispatch banner */}
        {unassigned > 0 && (
          <Link
            href="/service-orders?status=received"
            className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-5 py-4 hover:bg-orange-100 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  {unassigned} order{unassigned !== 1 ? 's' : ''} waiting to be dispatched
                </p>
                <p className="text-xs text-orange-600 mt-0.5">These received orders have not yet been assigned to an engineer</p>
              </div>
            </div>
            <span className="text-orange-600 font-medium text-sm group-hover:underline">Go to Dispatch →</span>
          </Link>
        )}

        {/* Status + Priority */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Status breakdown */}
          <section className="xl:col-span-3">
            <SectionHeading>Orders by Status</SectionHeading>
            <div className="grid grid-cols-2 gap-3">
              {openStatuses.map((status) => {
                const meta = STATUS_META[status]!;
                const count = stats.byStatus[status] ?? 0;
                return (
                  <Link
                    key={status}
                    href={`/service-orders?status=${status}`}
                    className={`bg-white rounded-xl border ${meta.colour} p-5 hover:shadow-md transition-shadow group`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {count}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                          <span className="text-sm font-medium text-gray-600">{meta.label}</span>
                        </div>
                      </div>
                      <span className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          {/* Priority breakdown */}
          <section className="xl:col-span-2">
            <SectionHeading>Orders by Priority</SectionHeading>
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
              {(['critical', 'high', 'medium', 'low'] as const).map((key) => {
                const meta = PRIORITY_META[key]!;
                const count = (stats.byPriority as Record<string, number>)[key] ?? 0;
                const pct = Math.round((count / priorityTotal) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${meta.text}`}>
                        {meta.label}
                      </span>
                      <span className="text-sm font-bold text-gray-800">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${meta.bar} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Engineers on shift + Recent completions */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Engineers on shift */}
          <section className="xl:col-span-2">
            <SectionHeading>Engineers on Shift</SectionHeading>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {clockedInEngineers.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-gray-400 text-sm">No engineers clocked in</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {clockedInEngineers.map((eng) => (
                    <li key={eng.id} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <Link
                          href={`/engineers/${eng.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {eng.firstName} {eng.lastName}
                        </Link>
                        {eng.currentOrderId ? (
                          <p className="text-xs text-gray-400 mt-0.5">
                            <Link href={`/service-orders/${eng.currentOrderId}`} className="hover:text-blue-500">
                              {eng.currentOrderRef ?? eng.currentOrderId}
                            </Link>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">No active job</p>
                        )}
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Recent completions */}
          <section className="xl:col-span-3">
            <SectionHeading>Recent Completions</SectionHeading>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {stats.recentlyCompleted.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-4xl mb-3">✓</p>
                  <p className="text-gray-400 text-sm">No completed orders yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stats.recentlyCompleted.map((order) => {
                      const pMeta = PRIORITY_META[String(order.priority)] ?? PRIORITY_META['medium']!;
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3.5">
                            <Link href={`/service-orders/${order.id}`} className="font-semibold text-blue-600 hover:underline">
                              {order.reference}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-gray-700">{order.siteName}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold uppercase tracking-wide ${pMeta.text}`}>
                              {pMeta.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-400 text-xs">
                            {new Date(order.updatedAt).toLocaleString('en-GB', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </div>

      </main>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

function KpiCard({ label, value, icon, bg, href }: {
  label: string; value: number; icon: React.ReactNode; bg: string; href: string;
}) {
  return (
    <Link href={href} className="group">
      <div className={`bg-gradient-to-br ${bg} rounded-xl p-5 text-white shadow-sm hover:shadow-lg transition-shadow`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium opacity-80">{label}</p>
            <p className="text-4xl font-bold mt-1">{value}</p>
          </div>
          <div className="opacity-70 group-hover:opacity-100 transition-opacity mt-0.5">{icon}</div>
        </div>
      </div>
    </Link>
  );
}

function OrdersIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function ClockAlertIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function EngineerIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
