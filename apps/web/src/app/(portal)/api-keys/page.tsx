import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import Header from '@/components/header';
import { adminApi, type ApiKey } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { NewKeyBanner } from './new-key-banner';
import { KeyActions } from './key-actions';

interface PageProps {
  searchParams: Promise<{ created?: string; plaintext?: string }>;
}

export default async function ApiKeysPage({ searchParams }: PageProps) {
  const { plaintext } = await searchParams;
  const keys = await adminApi.apiKeys.list();

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="API Keys" />

      <main className="p-6 space-y-5">
        {plaintext && (
          <NewKeyBanner plaintext={decodeURIComponent(plaintext)} />
        )}

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{keys.length} key{keys.length !== 1 ? 's' : ''}</p>
          <Link
            href="/api-keys/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Issue Key
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Scopes</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Used</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    No API keys issued yet
                  </td>
                </tr>
              ) : (
                keys.map((key) => (
                  <ApiKeyRow key={key.id} apiKey={key} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  async function suspend() {
    'use server';
    await adminApi.apiKeys.suspend(apiKey.id);
    revalidatePath('/api-keys');
  }

  async function activate() {
    'use server';
    await adminApi.apiKeys.activate(apiKey.id);
    revalidatePath('/api-keys');
  }

  async function revoke() {
    'use server';
    await adminApi.apiKeys.revoke(apiKey.id);
    revalidatePath('/api-keys');
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-5 py-3 font-medium text-gray-900">{apiKey.name}</td>
      <td className="px-5 py-3">
        <div className="flex flex-wrap gap-1 max-w-xs">
          {apiKey.scopes.map((scope) => (
            <Badge key={scope} variant="blue" size="sm">{scope}</Badge>
          ))}
        </div>
      </td>
      <td className="px-5 py-3 text-gray-500">
        {new Date(apiKey.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </td>
      <td className="px-5 py-3 text-gray-500">
        {apiKey.lastUsedAt
          ? new Date(apiKey.lastUsedAt).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric',
            })
          : '—'}
      </td>
      <td className="px-5 py-3">
        <Badge variant={apiKey.isActive ? 'green' : 'gray'}>
          {apiKey.isActive ? 'Active' : 'Suspended'}
        </Badge>
      </td>
      <td className="px-5 py-3">
        <KeyActions
          keyId={apiKey.id}
          keyName={apiKey.name}
          isActive={apiKey.isActive}
          suspendAction={suspend}
          activateAction={activate}
          revokeAction={revoke}
        />
      </td>
    </tr>
  );
}
