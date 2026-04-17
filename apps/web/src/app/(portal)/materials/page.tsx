import Header from '@/components/header';

export default function MaterialsPage() {
  return (
    <div className="flex-1 bg-gray-50">
      <Header title="Materials" />
      <main className="p-6">
        <div className="bg-white rounded-xl p-12 shadow-sm flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
            🔧
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Materials — Coming Soon</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            A consolidated view of all parts across open service orders — needed, back-ordered, and
            outstanding — will appear here once the materials endpoints are ready.
          </p>
        </div>
      </main>
    </div>
  );
}
