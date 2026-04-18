import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import Header from '@/components/header';
import { adminApi } from '@/lib/api';

export default async function InviteUserPage() {
  const warehouses = await adminApi.users.warehouses();

  async function inviteUser(formData: FormData) {
    'use server';
    const firstName   = formData.get('firstName') as string;
    const lastName    = formData.get('lastName') as string;
    const email       = formData.get('email') as string;
    const role        = formData.get('role') as string;
    const warehouseId = (formData.get('warehouseId') as string) || undefined;

    if (!firstName || !lastName || !email || !role) return;

    await adminApi.users.create({ firstName, lastName, email, role, warehouseId });
    revalidatePath('/engineers');
    redirect('/engineers?invited=1');
  }

  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Invite User" />

      <main className="p-6 max-w-2xl mx-auto">
        <nav className="text-sm text-gray-500 flex items-center gap-2 mb-6">
          <Link href="/engineers" className="hover:text-gray-700">Users</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Invite User</span>
        </nav>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500 mb-6">
            An invitation email will be sent to the address below. The user clicks the link to set their password and activate their account.
          </p>

          <form action={inviteUser} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                  First name <span className="text-red-500">*</span>
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  placeholder="Alex"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                  Last name <span className="text-red-500">*</span>
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  placeholder="Smith"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="alex.smith@example.com"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="role" className="text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="role"
                name="role"
                required
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Select role —</option>
                <option value="engineer">Engineer — mobile app access</option>
                <option value="dispatcher">Dispatcher — back office access</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="warehouseId" className="text-sm font-medium text-gray-700">
                Warehouse <span className="text-gray-400 font-normal">(optional — for engineers)</span>
              </label>
              <select
                id="warehouseId"
                name="warehouseId"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— No warehouse assigned —</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
              >
                Send Invite
              </button>
              <Link href="/engineers" className="text-sm text-gray-500 hover:text-gray-700">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
