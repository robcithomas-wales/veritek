import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

export default async function WebhooksPage() {
  const webhooks = await adminApi.webhooks.list();

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Webhooks" />

      <main className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{webhooks.length} subscription{webhooks.length !== 1 ? 's' : ''}</p>
          <Link
            href="/webhooks/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + New Webhook
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Endpoint</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Events</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-gray-400">
                    No webhook subscriptions yet
                  </td>
                </tr>
              ) : (
                webhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/webhooks/${wh.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {wh.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-600 font-mono text-xs max-w-xs truncate">
                      {wh.endpointUrl}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {wh.eventTypes.map((et) => (
                          <Badge key={et} variant="purple" size="sm">{et}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={wh.isActive ? 'green' : 'gray'}>
                        {wh.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {deliveryBadge(wh.lastDeliveryStatus)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function deliveryBadge(status: string | null) {
  if (!status) return <span className="text-gray-400 text-xs">—</span>;
  const variant =
    status === 'delivered' ? 'green' :
    status === 'failed'    ? 'red' :
    status === 'dead'      ? 'red' :
    'yellow';
  return <Badge variant={variant} size="sm">{status}</Badge>;
}
