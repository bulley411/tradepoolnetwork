'use client';

import { useState } from 'react';

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}