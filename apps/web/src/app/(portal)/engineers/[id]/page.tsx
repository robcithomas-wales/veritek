import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

interface PageProps {
  params: Promise<{ id: string }>;
}

type ClockEvent = {
  id: string;
  type: string;
  timestamp: string;
};

export default async function EngineerDetailPage({ params }: PageProps) {
  const { id } = await params;

  let engineer;
  try {
    engineer = await adminApi.users.get(id);
  } catch {
    notFound();
  }

  const clockEvents = (engineer.todayClockEvents ?? []) as ClockEvent[];

  return (
    <div className="flex-1 bg-gray-50">
      <Header title={`${engineer.firstName} ${engineer.lastName}`} />

      <main className="p-6 space-y-6 max-w-3xl">
        <nav className="text-sm text-gray-500 flex items-center gap-2">
          <Link href="/engineers" className="hover:text-gray-700">Engineers</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{engineer.firstName} {engineer.lastName}</span>
        </nav>

        {/* Profile */}
        <section className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Profile</h2>
            <span className="inline-flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${engineer.clockedIn ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${engineer.clockedIn ? 'text-green-700' : 'text-gray-500'}`}>
                {engineer.clockedIn ? 'Clocked in' : 'Clocked out'}
              </span>
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{engineer.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Role</dt>
              <dd className="mt-0.5 text-sm text-gray-900 capitalize">{engineer.role}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Van Stock Items</dt>
              <dd className="mt-0.5 text-sm text-gray-900">{engineer.vanStockCount ?? 0}</dd>
            </div>
            {engineer.currentOrder && (
              <div>
                <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Current Job</dt>
                <dd className="mt-0.5 text-sm">
                  <Link
                    href={`/service-orders/${engineer.currentOrder.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {engineer.currentOrder.reference} — {engineer.currentOrder.siteName}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Danger zone */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Danger Zone</h2>
          <p className="text-xs text-gray-500 mb-4">
            Deactivating removes this engineer&apos;s access immediately. This action cannot be undone from the portal.
          </p>
          <DeactivateForm engineerId={id} engineerName={`${engineer.firstName} ${engineer.lastName}`} />
        </section>

        {/* Today's clock events */}
        <section className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Today&apos;s Clock Events</h3>
          </div>
          {clockEvents.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No clock events today</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clockEvents.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-3 capitalize text-gray-700">{e.type.replace('_', ' ')}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(e.timestamp).toLocaleTimeString('en-GB', {
                        hour: '2-digit', minute: '2-digit',
                      })}
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

function DeactivateForm({ engineerId, engineerName }: { engineerId: string; engineerName: string }) {
  async function deactivate() {
    'use server';
    await adminApi.users.deactivate(engineerId);
    revalidatePath('/engineers');
    redirect('/engineers');
  }

  return (
    <form action={deactivate}>
      <input type="hidden" name="confirm" value={engineerName} />
      <button
        type="submit"
        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Deactivate {engineerName}
      </button>
    </form>
  );
}
