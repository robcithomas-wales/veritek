import Header from '@/components/header';
import Link from 'next/link';

export default function NewApiKeyPage() {
  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Issue API Key" />
      <main className="p-6 max-w-xl">
        <div className="bg-white rounded-xl p-8 shadow-sm text-center space-y-3">
          <p className="text-gray-500 text-sm">
            API key issuance form — coming in a future release.
          </p>
          <Link href="/api-keys" className="inline-block text-sm text-blue-600 hover:underline">
            Back to API keys
          </Link>
        </div>
      </main>
    </div>
  );
}
