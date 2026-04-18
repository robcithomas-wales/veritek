import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';
import type { AdminMaterial } from '@/lib/api';

const STATUS_META: Record<string, { label: string; colour: string; dot: string }> = {
  needed:       { label: 'Needed',       colour: 'bg-blue-50 text-blue-700 border-blue-200',     dot: 'bg-blue-500' },
  allocated:    { label: 'Allocated',    colour: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  back_ordered: { label: 'Back-ordered', colour: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-500' },
  fulfilled:    { label: 'Fulfilled',    colour: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-500' },
  not_used:     { label: 'Not Used',     colour: 'bg-gray-50 text-gray-600 border-gray-200',      dot: 'bg-gray-400' },
  cancelled:    { label: 'Cancelled',    colour: 'bg-red-50 text-red-600 border-red-200',         dot: 'bg-red-400' },
};

const ORDER_STATUS_META: Record<string, { label: string; dot: string }> = {
  received:    { label: 'Received',    dot: 'bg-slate-400' },
  accepted:    { label: 'Accepted',    dot: 'bg-blue-500' },
  in_route:    { label: 'In Route',    dot: 'bg-violet-500' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-500' },
  completed:   { label: 'Completed',   dot: 'bg-green-500' },
  closed:      { label: 'Closed',      dot: 'bg-gray-400' },
};

const ALL_STATUSES = ['needed', 'allocated', 'back_ordered', 'fulfilled', 'not_used', 'cancelled'];

type Props = {
  searchParams: Promise<{ status?: string; engineerId?: string }>;
};

export default async function MaterialsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = params.status;

  const materials = await adminApi.materials.list(status ? { status } : undefined);

  // Group by service order
  const byOrder = new Map<string, { ref: AdminMaterial['serviceOrder']; items: AdminMaterial[] }>();
  for (const m of materials) {
    const key = m.serviceOrder.id;
    if (!byOrder.has(key)) {
      byOrder.set(key, { ref: m.serviceOrder, items: [] });
    }
    byOrder.get(key)!.items.push(m);
  }

  const groups = Array.from(byOrder.values());

  // Summary counts
  const counts: Record<string, number> = {};
  for (const m of materials) {
    counts[m.status] = (counts[m.status] ?? 0) + 1;
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <Header title="Materials" />

      <main className="p-6 space-y-6">

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2">
          <FilterChip href="/materials" label="All" active={!status} count={materials.length} />
          {ALL_STATUSES.map((s) => {
            const meta = STATUS_META[s]!;
            return (
              <FilterChip
                key={s}
                href={`/materials?status=${s}`}
                label={meta.label}
                active={status === s}
                count={counts[s] ?? 0}
                dot={meta.dot}
              />
            );
          })}
        </div>

        {materials.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <p className="text-4xl mb-3">📦</p>
            <p className="text-gray-500 text-sm">No materials found for the selected filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(({ ref, items }) => {
              const orderMeta = ORDER_STATUS_META[ref.status] ?? { label: ref.status, dot: 'bg-gray-400' };
              const hasAtRisk = items.some(
                (m) => m.status === 'back_ordered' || m.status === 'needed',
              );
              return (
                <section key={ref.id}>
                  <div className="flex items-center gap-3 mb-2">
                    <Link
                      href={`/service-orders/${ref.id}`}
                      className="font-semibold text-sm text-blue-600 hover:underline"
                    >
                      {ref.reference}
                    </Link>
                    <span className="text-gray-400 text-sm">·</span>
                    <span className="text-sm text-gray-600">{ref.siteName ?? '—'}</span>
                    {ref.engineerName && (
                      <>
                        <span className="text-gray-400 text-sm">·</span>
                        <span className="text-sm text-gray-500">{ref.engineerName}</span>
                      </>
                    )}
                    <div className="flex items-center gap-1.5 ml-1">
                      <span className={`w-2 h-2 rounded-full ${orderMeta.dot}`} />
                      <span className="text-xs text-gray-500">{orderMeta.label}</span>
                    </div>
                    {hasAtRisk && (
                      <span className="ml-auto text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Parts outstanding
                      </span>
                    )}
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Part</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Returnable</th>
                          <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Return Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((m) => {
                          const sMeta = STATUS_META[m.status] ?? { label: m.status, colour: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
                          return (
                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{m.product.sku}</td>
                              <td className="px-5 py-3.5 font-medium text-gray-900">{m.product.name}</td>
                              <td className="px-5 py-3.5 text-gray-700">{m.qty}</td>
                              <td className="px-5 py-3.5">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${sMeta.colour}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${sMeta.dot}`} />
                                  {sMeta.label}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-gray-500 text-xs">
                                {m.returnable ? 'Yes' : 'No'}
                              </td>
                              <td className="px-5 py-3.5 text-gray-500 text-xs">
                                {m.returnReason ?? '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
  count,
  dot,
}: {
  href: string;
  label: string;
  active: boolean;
  count: number;
  dot?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
      }`}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dot}`} />}
      {label}
      <span
        className={`text-xs px-1.5 py-0.5 rounded-full ${
          active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {count}
      </span>
    </Link>
  );
}
