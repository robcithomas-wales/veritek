'use client';

import { useTransition } from 'react';

interface KeyActionsProps {
  keyId: string;
  keyName: string;
  isActive: boolean;
  suspendAction: () => Promise<void>;
  activateAction: () => Promise<void>;
  revokeAction: () => Promise<void>;
}

export function KeyActions({
  keyName,
  isActive,
  suspendAction,
  activateAction,
  revokeAction,
}: KeyActionsProps) {
  const [pending, startTransition] = useTransition();

  function handleRevoke() {
    if (!confirm(`Permanently revoke "${keyName}"? This cannot be undone.`)) return;
    startTransition(() => revokeAction());
  }

  return (
    <div className="flex items-center gap-3">
      {isActive ? (
        <form action={suspendAction}>
          <button
            type="submit"
            disabled={pending}
            className="text-xs text-orange-600 hover:underline font-medium disabled:opacity-40"
          >
            Suspend
          </button>
        </form>
      ) : (
        <form action={activateAction}>
          <button
            type="submit"
            disabled={pending}
            className="text-xs text-blue-600 hover:underline font-medium disabled:opacity-40"
          >
            Activate
          </button>
        </form>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={handleRevoke}
        className="text-xs text-red-600 hover:underline font-medium disabled:opacity-40"
      >
        Revoke
      </button>
    </div>
  );
}
