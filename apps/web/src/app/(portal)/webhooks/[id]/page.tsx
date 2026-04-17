import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WebhookDetailPage({ params }: PageProps) {
  const { id } = await params;

  let wh;
  try {
    wh = await adminApi.webhooks.get(id);
  } catch {
    notFound();
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

        {/* Overview */}
        <section className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Subscription Details</h2>
            <Badge variant={wh.isActive ? 'green' : 'gray'}>
              {wh.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Endpoint URL</dt>
              <dd className="mt-0.5 text-sm text-gray-900 font-mono break-all">{wh.endpointUrl}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Created</dt>
              <dd className="mt-0.5 text-sm text-gray-900">
                {new Date(wh.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Event Types</dt>
              <dd className="flex flex-wrap gap-1">
                {wh.eventTypes.map((et) => (
                  <Badge key={et} variant="purple" size="sm">{et}</Badge>
                ))}
              </dd>
            </div>
          </dl>
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
    const { revalidatePath } = await import('next/cache');
    revalidatePath(`/webhooks/${webhookId}`);
  }

  return (
    <form action={retry}>
      <button
        type="submit"
        className="text-xs text-blue-600 hover:underline font-medium"
      >
        Retry
      </button>
    </form>
  );
}
