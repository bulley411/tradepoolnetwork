import { getMyActiveCommitments } from '@/services/session-service';
import Link from 'next/link';

export default async function MyCommitmentsPage() {
  const { commitments, error } = await getMyActiveCommitments();

  return (
    <div className="py-8">
      <h1 className="text-2xl font-bold mb-2">My Active Investments</h1>
      <p className="text-gray-600 mb-6">
        Funds currently locked in active trading sessions
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!commitments || commitments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No active commitments</p>
          <Link
            href="/member/sessions"
            className="inline-block mt-3 text-blue-600 hover:underline"
          >
            Browse available sessions →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {commitments.map((commitment: any) => (
            <div key={commitment.id} className="border rounded-lg p-5 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{commitment.session?.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Status: <span className="capitalize">{commitment.session?.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">
                    ${commitment.amount?.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {commitment.contribution_pct?.toFixed(2)}% of pool
                  </div>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                <div className="flex justify-between">
                  <span>Total Pool: ${commitment.session?.total_committed?.toFixed(2)}</span>
                  <span>Committed: {new Date(commitment.committed_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}