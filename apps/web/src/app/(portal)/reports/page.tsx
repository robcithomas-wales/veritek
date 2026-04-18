import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';
import { CsvButton, PrintButton } from './report-actions';

const PERIODS = [
  { value: '7d',  label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
];

type Props = {
  searchParams: Promise<{ period?: string; tab?: string }>;
};

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const period = (params.period as '7d' | '30d' | '90d') ?? '30d';
  const tab = params.tab ?? 'completed';

  const data = await adminApi.reports.get({ period });

  const periodLabel =
    `${new Date(data.period.from).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}` +
    ` – ` +
    `${new Date(data.period.to).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  // Build sorted day-bucket list for the bar chart
  const days = Object.entries(data.completed.byDay)
    .sort(([a], [b]) => a.localeCompare(b));
  const maxDay = Math.max(...days.map(([, v]) => v), 1);

  // CSV row data
  const completedCsvRows = data.completed.orders.map((o) => [
    o.reference,
    o.siteName,
    o.engineerName ?? '',
    new Date(o.completedAt).toLocaleString('en-GB'),
    o.withinSla ? 'Met' : 'Breached',
  ]);

  const breachesCsvRows = data.completed.orders
    .filter((o) => !o.withinSla)
    .map((o) => [
      o.reference,
      o.siteName,
      o.engineerName ?? '',
      new Date(o.completedAt).toLocaleString('en-GB'),
    ]);

  const partsCsvRows = data.partsUsage.map((p, i) => [
    i + 1,
    p.sku,
    p.name,
    p.qty,
  ]);

  return (
    <>
      {/* Print CSS — hides chrome, shows full content regardless of active tab */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          nav, aside, [data-sidebar] { display: none !important; }
          body { background: white !important; }
          .print-show { display: block !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="flex-1 bg-gray-50 min-h-screen">
        <Header title="Reports" />

        <main className="p-6 space-y-6">

          {/* Period selector */}
          <div className="no-print flex items-center gap-2">
            {PERIODS.map((p) => (
              <Link
                key={p.value}
                href={`/reports?period=${p.value}&tab=${tab}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  period === p.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                }`}
              >
                {p.label}
              </Link>
            ))}
            <span className="ml-auto text-xs text-gray-400">{periodLabel}</span>
            <PrintButton />
          </div>

          {/* Print-only header */}
          <div className="hidden print:block mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Veritek Reports</h1>
            <p className="text-sm text-gray-500">{periodLabel}</p>
          </div>

          {/* KPI row — Print button lives inside the last card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Jobs Completed"
              value={data.completed.total}
              bg="from-blue-500 to-blue-600"
              icon={<CheckIcon />}
            />
            <StatCard
              label="SLA Met (≤ 4h)"
              value={`${data.completed.slaPct}%`}
              bg={data.completed.slaPct >= 80 ? 'from-green-500 to-green-600' : data.completed.slaPct >= 50 ? 'from-amber-500 to-amber-600' : 'from-red-500 to-red-600'}
              icon={<ClockIcon />}
              sub={`${data.completed.withinSla} of ${data.completed.total}`}
            />
            <StatCard
              label="Unique Parts Used"
              value={data.partsUsage.length}
              bg="from-violet-500 to-violet-600"
              icon={<BoxIcon />}
            />
          </div>

          {/* Tab switcher */}
          <div className="no-print flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            {[
              { key: 'completed', label: 'Completed Jobs' },
              { key: 'sla', label: 'SLA Performance' },
              { key: 'parts', label: 'Parts Usage' },
            ].map((t) => (
              <Link
                key={t.key}
                href={`/reports?period=${period}&tab=${t.key}`}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* Tab: Completed jobs */}
          {tab === 'completed' && (
            <section className="space-y-4">
              {/* Daily bar chart */}
              {days.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                    Completions per day
                  </p>
                  <div className="flex items-end gap-1.5 h-32">
                    {days.map(([day, count]) => (
                      <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
                        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {count}
                        </span>
                        <div
                          className="w-full bg-blue-500 rounded-t-sm transition-all"
                          style={{ height: `${Math.max(4, (count / maxDay) * 100)}%` }}
                        />
                        <span className="text-[10px] text-gray-400 rotate-45 origin-left mt-1 hidden sm:block">
                          {new Date(day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed orders table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {data.completed.orders.length === 0 ? (
                  <div className="py-16 text-center">
                    <p className="text-3xl mb-3">✓</p>
                    <p className="text-gray-400 text-sm">No completed orders in this period</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {data.completed.orders.length} orders
                      </p>
                      <CsvButton
                        filename={`completed-jobs-${period}.csv`}
                        headers={['Reference', 'Site', 'Engineer', 'Completed At', 'SLA']}
                        rows={completedCsvRows}
                      />
                    </div>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Engineer</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SLA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.completed.orders.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <Link href={`/service-orders/${o.id}`} className="font-semibold text-blue-600 hover:underline">
                                {o.reference}
                              </Link>
                            </td>
                            <td className="px-5 py-3.5 text-gray-700">{o.siteName}</td>
                            <td className="px-5 py-3.5 text-gray-500">{o.engineerName ?? '—'}</td>
                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                              {new Date(o.completedAt).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                o.withinSla ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                              }`}>
                                {o.withinSla ? 'Met' : 'Breached'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Tab: SLA performance */}
          {tab === 'sla' && (
            <section className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center gap-6">
                <div className="flex items-center gap-12">
                  <SlaGauge pct={data.completed.slaPct} />
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700">
                        Within SLA: <span className="font-bold">{data.completed.withinSla}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="text-sm text-gray-700">
                        Breached: <span className="font-bold">{data.completed.total - data.completed.withinSla}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-gray-300" />
                      <span className="text-sm text-gray-700">
                        Total: <span className="font-bold">{data.completed.total}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400">SLA target: response and resolution within 4 hours</p>
              </div>

              {/* SLA breaches table */}
              {data.completed.orders.some((o) => !o.withinSla) && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">SLA Breaches</p>
                    <CsvButton
                      label="Download CSV"
                      filename={`sla-breaches-${period}.csv`}
                      headers={['Reference', 'Site', 'Engineer', 'Completed At']}
                      rows={breachesCsvRows}
                    />
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Reference</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Engineer</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Completed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.completed.orders
                        .filter((o) => !o.withinSla)
                        .map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5">
                              <Link href={`/service-orders/${o.id}`} className="font-semibold text-blue-600 hover:underline">
                                {o.reference}
                              </Link>
                            </td>
                            <td className="px-5 py-3.5 text-gray-700">{o.siteName}</td>
                            <td className="px-5 py-3.5 text-gray-500">{o.engineerName ?? '—'}</td>
                            <td className="px-5 py-3.5 text-gray-400 text-xs">
                              {new Date(o.completedAt).toLocaleString('en-GB', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Tab: Parts usage */}
          {tab === 'parts' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {data.partsUsage.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-3xl mb-3">📦</p>
                  <p className="text-gray-400 text-sm">No parts fitted in this period</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Top {data.partsUsage.length} parts by quantity fitted
                    </p>
                    <CsvButton
                      filename={`parts-usage-${period}.csv`}
                      headers={['Rank', 'SKU', 'Part Name', 'Qty Fitted']}
                      rows={partsCsvRows}
                    />
                  </div>
                  <div className="p-5 space-y-3">
                    {data.partsUsage.map((p, i) => {
                      const maxQty = data.partsUsage[0]?.qty ?? 1;
                      const pct = Math.round((p.qty / maxQty) * 100);
                      return (
                        <div key={p.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                              <span className="text-sm font-medium text-gray-800">{p.name}</span>
                              <span className="text-xs font-mono text-gray-400">{p.sku}</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900">{p.qty}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-5" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

function StatCard({
  label, value, bg, icon, sub,
}: {
  label: string;
  value: string | number;
  bg: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bg} rounded-xl p-5 text-white shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{label}</p>
          <p className="text-4xl font-bold mt-1">{value}</p>
          {sub && <p className="text-xs opacity-70 mt-1">{sub}</p>}
        </div>
        <div className="opacity-70 mt-0.5">{icon}</div>
      </div>
    </div>
  );
}

function SlaGauge({ pct }: { pct: number }) {
  const r = 56;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={r} fill="none" stroke="#f3f4f6" strokeWidth="12" />
        <circle
          cx="72" cy="72" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          transform="rotate(-90 72 72)"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-gray-900">{pct}%</span>
        <span className="text-xs text-gray-400">SLA met</span>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
