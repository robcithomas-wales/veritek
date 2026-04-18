import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi, type AdminUser } from '@/lib/api';
import { StatusBadge, PriorityBadge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

type Activity = {
  id: string;
  type: string;
  status: string;
  travelStartedAt?: string | null;
  workStartedAt?: string | null;
  workEndedAt?: string | null;
  stopCode?: string | null;
  comment?: string | null;
};

type Material = {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  status: string;
  disposition: string;
};

type Item = {
  id: string;
  serialNumber?: string | null;
  productName: string;
  installedAt?: string | null;
};

export default async function ServiceOrderDetailPage({ params }: PageProps) {
  const { id } = await params;

  let order;
  try {
    order = await adminApi.serviceOrders.get(id);
  } catch {
    notFound();
  }

  const engineers: AdminUser[] = await adminApi.users.list({ role: 'engineer' });

  const activities = (order.activities ?? []) as Activity[];
  const materials  = (order.materials  ?? []) as Material[];
  const items      = (order.items      ?? []) as Item[];

  return (
    <div className="flex-1 bg-gray-50">
      <Header title={`Order ${order.reference}`} />

      <main className="p-6 space-y-6 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/service-orders" className="hover:text-gray-700">Service Orders</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{order.reference}</span>
        </nav>

        {/* Overview card */}
        <section className="bg-white rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">{order.reference}</h2>
              <p className="text-sm text-gray-600">{order.site?.name ?? order.siteName}</p>
              {order.site?.address && (
                <p className="text-xs text-gray-400">{order.site.address}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={order.priority} />
              <StatusBadge status={order.status} />
            </div>
          </div>

          {order.description && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Description</p>
              <p className="text-sm text-gray-700">{order.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Detail label="Assigned Engineer" value={
              order.assignedTo
                ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}`
                : '—'
            } />
            <Detail label="ETA" value={
              order.eta
                ? new Date(order.eta).toLocaleString('en-GB', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })
                : '—'
            } />
            <Detail label="Created" value={
              new Date(order.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
              })
            } />
          </div>
        </section>

        {/* Assign engineer action */}
        <section className="bg-white rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Assign Engineer</h3>
            <AssignForm orderId={order.id} engineers={engineers} currentEngineerId={order.assignedTo?.id} />
          </div>

          {['received', 'accepted', 'in_route', 'in_progress'].includes(order.status) && (
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Close Order</h3>
              <p className="text-xs text-gray-500 mb-3">
                Mark this order as completed without engineer sign-off. Use this to close stale or admin-resolved orders.
              </p>
              <CloseOrderForm orderId={order.id} />
            </div>
          )}
        </section>

        {/* Activities */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Activities</h3>
          </div>
          {activities.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No activities recorded</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Travel Start</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Work Start</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Work End</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stop Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3 capitalize">{a.type}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-500">{a.travelStartedAt ? fmt(a.travelStartedAt) : '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{a.workStartedAt ? fmt(a.workStartedAt) : '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{a.workEndedAt ? fmt(a.workEndedAt) : '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{a.stopCode ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Materials */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Materials</h3>
          </div>
          {materials.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No materials on this order</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Disposition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {materials.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{m.productName}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono text-xs">{m.sku}</td>
                    <td className="px-5 py-3">{m.quantity}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-5 py-3 capitalize text-gray-600">{m.disposition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Items */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Equipment</h3>
          </div>
          {items.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No equipment on this order</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Serial</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Installed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{item.productName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-500">{item.serialNumber ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {item.installedAt ? fmt(item.installedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

function CloseOrderForm({ orderId }: { orderId: string }) {
  async function close() {
    'use server';
    await adminApi.serviceOrders.close(orderId);
    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/service-orders/${orderId}`);
    revalidatePath('/service-orders');
  }

  return (
    <form action={close}>
      <button
        type="submit"
        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Close Order
      </button>
    </form>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm text-gray-900">{value}</p>
    </div>
  );
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

function AssignForm({
  orderId,
  engineers,
  currentEngineerId,
}: {
  orderId: string;
  engineers: AdminUser[];
  currentEngineerId: string | undefined;
}) {
  async function assign(formData: FormData) {
    'use server';
    const engineerId = formData.get('engineerId') as string;
    const eta        = formData.get('eta') as string | null;
    if (!engineerId) return;
    await adminApi.serviceOrders.assign(orderId, engineerId, eta ?? undefined);
    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/service-orders/${orderId}`);
  }

  return (
    <form action={assign} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="engineerId" className="text-xs font-medium text-gray-500">Engineer</label>
        <select
          id="engineerId"
          name="engineerId"
          defaultValue={currentEngineerId ?? ''}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-52"
        >
          <option value="">— Select engineer —</option>
          {engineers.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
              {e.clockedIn ? ' (clocked in)' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="eta" className="text-xs font-medium text-gray-500">ETA (optional)</label>
        <input
          id="eta"
          name="eta"
          type="datetime-local"
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Assign
      </button>
    </form>
  );
}
