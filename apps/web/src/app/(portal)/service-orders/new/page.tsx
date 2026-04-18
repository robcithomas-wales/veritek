import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

export default async function NewServiceOrderPage() {
  const [sites, engineers] = await Promise.all([
    adminApi.sites.list(),
    adminApi.users.list({ role: 'engineer' }),
  ]);

  async function createOrder(formData: FormData) {
    'use server';
    const siteId      = formData.get('siteId') as string;
    const description = formData.get('description') as string;
    const priority    = parseInt(formData.get('priority') as string, 10);
    const engineerId  = (formData.get('engineerId') as string) || undefined;
    const eta         = (formData.get('eta') as string) || undefined;

    const order = await adminApi.serviceOrders.create({
      siteId,
      description,
      priority,
      engineerId,
      eta,
    });
    revalidatePath('/service-orders');
    redirect(`/service-orders/${order.id}`);
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="New Service Order" />

      <main className="p-6 max-w-2xl">
        <nav className="text-sm text-gray-500 flex items-center gap-2 mb-6">
          <Link href="/service-orders" className="hover:text-gray-700">Service Orders</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New</span>
        </nav>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form action={createOrder} className="space-y-5">
            {/* Site */}
            <div className="flex flex-col gap-1">
              <label htmlFor="siteId" className="text-sm font-medium text-gray-700">
                Site <span className="text-red-500">*</span>
              </label>
              <select
                id="siteId"
                name="siteId"
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select a site —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={3}
                placeholder="Describe the fault or work required…"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1">
              <label htmlFor="priority" className="text-sm font-medium text-gray-700">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                required
                defaultValue="3"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">1 — Critical</option>
                <option value="2">2 — High</option>
                <option value="3">3 — Medium</option>
                <option value="4">4 — Low</option>
                <option value="5">5 — Planned</option>
              </select>
            </div>

            {/* Assign engineer (optional) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="engineerId" className="text-sm font-medium text-gray-700">
                Assign Engineer <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select
                id="engineerId"
                name="engineerId"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Unassigned —</option>
                {engineers.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}{e.clockedIn ? ' (clocked in)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* ETA (optional) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="eta" className="text-sm font-medium text-gray-700">
                ETA <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="eta"
                name="eta"
                type="datetime-local"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Create Service Order
              </button>
              <Link
                href="/service-orders"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
