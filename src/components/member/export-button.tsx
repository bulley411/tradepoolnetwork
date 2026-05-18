'use client';

export function ExportButton() {
  async function handleExport() {
    window.location.href = '/api/wallet/export';
  }

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2"
    >
      📥 Export CSV
    </button>
  );
}