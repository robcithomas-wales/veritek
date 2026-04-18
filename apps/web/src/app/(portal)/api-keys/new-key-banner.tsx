'use client';

import { useState } from 'react';

export function NewKeyBanner({ plaintext }: { plaintext: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(plaintext).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
      <p className="text-sm font-semibold text-green-800">API key created</p>
      <p className="text-xs text-green-700">
        Copy the key below — it will never be shown again.
      </p>
      <div className="flex items-center gap-3">
        <code className="flex-1 bg-white border border-green-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-900 break-all">
          {plaintext}
        </code>
        <button
          onClick={copy}
          className="shrink-0 text-xs bg-green-700 hover:bg-green-800 text-white px-3 py-2 rounded-lg font-medium transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
