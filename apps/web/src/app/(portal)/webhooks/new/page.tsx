import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

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

export default function NewWebhookPage() {
  async function createWebhook(formData: FormData) {
    'use server';
    const name        = formData.get('name') as string;
    const endpointUrl = formData.get('endpointUrl') as string;
    const eventTypes  = DOMAIN_EVENTS.filter((e) => formData.get(`event:${e}`) === 'on');

    if (!name || !endpointUrl || eventTypes.length === 0) return;

    const wh = await adminApi.webhooks.create({ name, endpointUrl, eventTypes });
    revalidatePath('/webhooks');
    redirect(`/webhooks/${wh.id}`);
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="New Webhook" />

      <main className="p-6 max-w-2xl">
        <nav className="text-sm text-gray-500 flex items-center gap-2 mb-6">
          <Link href="/webhooks" className="hover:text-gray-700">Webhooks</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New</span>
        </nav>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form action={createWebhook} className="space-y-5">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Salesforce job sync"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
              />
            </div>

            {/* Endpoint URL */}
            <div className="flex flex-col gap-1">
              <label htmlFor="endpointUrl" className="text-sm font-medium text-gray-700">
                Endpoint URL <span className="text-red-500">*</span>
              </label>
              <input
                id="endpointUrl"
                name="endpointUrl"
                type="url"
                required
                placeholder="https://example.com/webhooks/veritek"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Event types */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">
                Event types <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {DOMAIN_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`event:${event}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-mono text-xs">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Create Webhook
              </button>
              <Link href="/webhooks" className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
