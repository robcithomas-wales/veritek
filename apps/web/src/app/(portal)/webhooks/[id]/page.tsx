import { notFound } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

const DOMAIN_EVENTS = [
  'job.assigned',
  'job.accepted',
  'job.rejected',
  'travel.started',
  'work.started',
  'job.completed',
  'part.ordered',
  'part.fitted',
  'part.returned',
  'clock.in',
  'clock.out',
  'private-activity.created',
  'private-activity.completed',
  'item.installed',
  'item.removed',
];

export default async function WebhookDetailPage({ params }: PageProps) {
  const { id } = await params;

  let wh;
  try {
    wh = await adminApi.webhooks.get(id);
  } catch {
    notFound();
  }

  async function updateWebhook(formData: FormData) {
    'use server';
    const endpointUrl = formData.get('endpointUrl') as string;
    const isActive    = formData.get('isActive') === 'true';
    const eventTypes  = DOMAIN_EVENTS.filter((e) => formData.get(`event:${e}`) === 'on');
    await adminApi.webhooks.update(id, { endpointUrl, isActive, eventTypes });
    revalidatePath(`/webhooks/${id}`);
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header title={wh.name} />

      <main className="p-6 space-y-6 max-w-4xl">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/webhooks" className="hover:text-gray-700">Webhooks</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{wh.name}</span>
        </nav>

        {/* Edit form */}
        <section className="bg-white rounded-xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Subscription Settings</h2>
            <Badge variant={wh.isActive ? 'green' : 'gray'}>
              {wh.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <form action={updateWebhook} className="space-y-5">
            {/* Endpoint URL */}
            <div className="flex flex-col gap-1">
              <label htmlFor="endpointUrl" className="text-sm font-medium text-gray-700">Endpoint URL</label>
              <input
                id="endpointUrl"
                name="endpointUrl"
                type="url"
                required
                defaultValue={wh.endpointUrl}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* Status toggle */}
            <div className="flex flex-col gap-1">
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Status</label>
              <select
                id="isActive"
                name="isActive"
                defaultValue={String(wh.isActive)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>

            {/* Event types */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">Event types</p>
              <div className="grid grid-cols-2 gap-2">
                {DOMAIN_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`event:${event}`}
                      defaultChecked={wh.eventTypes.includes(event)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-mono text-xs">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Delivery log */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Delivery Log</h3>
          </div>
          {wh.deliveries.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No deliveries yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Attempts</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Response</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {wh.deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-mono text-xs text-gray-700">{d.eventType}</td>
                    <td className="px-5 py-3">
                      <Badge variant={
                        d.status === 'delivered' ? 'green' :
                        d.status === 'pending'   ? 'yellow' :
                        'red'
                      } size="sm">
                        {d.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{d.attempts}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {d.responseCode ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(d.createdAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      {(d.status === 'failed' || d.status === 'dead') && (
                        <RetryButton webhookId={wh.id} deliveryId={d.id} />
                      )}
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

function RetryButton({ webhookId, deliveryId }: { webhookId: string; deliveryId: string }) {
  async function retry() {
    'use server';
    await adminApi.webhooks.retry(webhookId, deliveryId);
    revalidatePath(`/webhooks/${webhookId}`);
  }

  return (
    <form action={retry}>
      <button type="submit" className="text-xs text-blue-600 hover:underline font-medium">
        Retry
      </button>
    </form>
  );
}
