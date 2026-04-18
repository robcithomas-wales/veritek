import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

const AVAILABLE_SCOPES = [
  { value: 'service-orders:read',  label: 'Service Orders — Read' },
  { value: 'service-orders:write', label: 'Service Orders — Write' },
  { value: 'materials:read',       label: 'Materials — Read' },
  { value: 'materials:write',      label: 'Materials — Write' },
  { value: 'sites:read',           label: 'Sites — Read' },
  { value: 'sites:write',          label: 'Sites — Write' },
  { value: 'users:read',           label: 'Users — Read' },
  { value: 'inventory:read',       label: 'Inventory — Read' },
  { value: 'webhooks:read',        label: 'Webhooks — Read' },
  { value: 'webhooks:write',       label: 'Webhooks — Write' },
];

export default function NewApiKeyPage() {
  async function createKey(formData: FormData) {
    'use server';
    const name      = formData.get('name') as string;
    const expiresAt = (formData.get('expiresAt') as string) || undefined;
    const scopes    = AVAILABLE_SCOPES
      .map((s) => s.value)
      .filter((v) => formData.get(`scope:${v}`) === 'on');

    if (!name || scopes.length === 0) return;

    const key = await adminApi.apiKeys.create({ name, scopes, expiresAt });
    revalidatePath('/api-keys');
    redirect(`/api-keys?created=${key.id}&plaintext=${encodeURIComponent(key.plaintext)}`);
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Issue API Key" />

      <main className="p-6 max-w-2xl mx-auto">
        <nav className="text-sm text-gray-500 flex items-center gap-2 mb-6">
          <Link href="/api-keys" className="hover:text-gray-700">API Keys</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New</span>
        </nav>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form action={createKey} className="space-y-5">
            {/* Name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Key name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Salesforce integration"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-sm"
              />
            </div>

            {/* Scopes */}
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-700">
                Scopes <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label key={scope.value} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`scope:${scope.value}`}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {scope.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Expiry (optional) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="expiresAt" className="text-sm font-medium text-gray-700">
                Expiry date <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="expiresAt"
                name="expiresAt"
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Issue Key
              </button>
              <Link href="/api-keys" className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
