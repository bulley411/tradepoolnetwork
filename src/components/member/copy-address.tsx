'use client';

import { useState } from 'react';

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}