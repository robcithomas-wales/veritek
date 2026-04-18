import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

export default function NewSitePage() {
  async function createSite(formData: FormData) {
    'use server';
    const name     = formData.get('name') as string;
    const address  = (formData.get('address') as string) || undefined;
    const postcode = (formData.get('postcode') as string) || undefined;

    await adminApi.sites.create({ name, address, postcode });
    revalidatePath('/sites');
    redirect('/sites');
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Add Site" />

      <main className="p-6 max-w-xl">
        <nav className="text-sm text-gray-500 flex items-center gap-2 mb-6">
          <Link href="/sites" className="hover:text-gray-700">Sites</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">New</span>
        </nav>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <form action={createSite} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-gray-700">
                Site name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Manchester Depot"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="address" className="text-sm font-medium text-gray-700">
                Address <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="address"
                name="address"
                type="text"
                placeholder="e.g. 12 Industrial Estate, Manchester"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="postcode" className="text-sm font-medium text-gray-700">
                Postcode <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="postcode"
                name="postcode"
                type="text"
                placeholder="e.g. M1 1AA"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-40"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Add Site
              </button>
              <Link href="/sites" className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
