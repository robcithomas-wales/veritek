import Link from 'next/link';
import { Suspense } from 'react';
import Header from '@/components/header';
import { adminApi, type AdminOrderQuery } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';
import FilterBar from './filter-bar';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = searchParams[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function ServiceOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const page = Number(getParam(sp, 'page') ?? 1);

  const query: AdminOrderQuery = {
    status:     getParam(sp, 'status'),
    priority:   getParam(sp, 'priority'),
    engineerId: getParam(sp, 'engineerId'),
    query:      getParam(sp, 'query'),
    page,
    pageSize:   25,
  };

  const { data: orders, total, pageSize } = await adminApi.serviceOrders.list(query);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Service Orders" />

      <main className="p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Suspense fallback={null}>
            <FilterBar />
          </Suspense>
          <Link
            href="/service-orders/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Order
          </Link>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Site</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Engineer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No service orders match your filters
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/service-orders/${order.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {order.reference}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-700">{order.siteName}</td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={order.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-700">{order.engineerName ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Showing {orders.length} of {total} orders
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildPageUrl(sp, page - 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildPageUrl(sp, page + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function buildPageUrl(
  sp: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === 'page') continue;
    if (v !== undefined) params.set(k, Array.isArray(v) ? v[0] : v);
  }
  params.set('page', String(page));
  return `/service-orders?${params.toString()}`;
}
