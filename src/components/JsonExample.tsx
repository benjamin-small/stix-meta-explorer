import { useState } from 'react';

interface JsonExampleProps {
  data: Record<string, unknown>;
}

export default function JsonExample({ data }: JsonExampleProps) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        aria-label="Copy JSON"
        className="absolute top-3 right-3 text-xs text-cti-muted hover:text-cti-text bg-cti-bg/50 px-2 py-1 rounded"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <pre className="bg-cti-bg border border-cti-border rounded-lg p-4 overflow-x-auto text-xs font-mono text-cti-text">
        {json}
      </pre>
    </div>
  );
}
