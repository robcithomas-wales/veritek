import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

export default async function SitesPage() {
  const sites = await adminApi.sites.list();

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Sites" />

      <main className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{sites.length} site{sites.length !== 1 ? 's' : ''}</p>
          <Link
            href="/sites/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Add Site
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Address</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Postcode</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400">
                    No sites yet
                  </td>
                </tr>
              ) : (
                sites.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{site.name}</td>
                    <td className="px-5 py-3 text-gray-500">{site.address ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{site.postcode ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/sites/${site.id}/edit`}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
