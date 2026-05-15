import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { openSession, closeCommitments, startTrading } from '@/features/admin/actions';

export default async function SessionsPage() {
  const supabase = await createClient();
  
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false });
  
  return (
    <div className="py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trading Sessions</h1>
        <Link
          href="/admin/sessions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Session
        </Link>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Committed</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions?.map((session) => (
              <tr key={session.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{session.title}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${session.status === 'open' ? 'bg-green-100 text-green-800' : ''}
                    ${session.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                    ${session.status === 'committed' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${session.status === 'trading' ? 'bg-blue-100 text-blue-800' : ''}
                    ${session.status === 'settlement' ? 'bg-purple-100 text-purple-800' : ''}
                  `}>
                    {session.status}
                  </span>
                </td>
                <td className="p-3">${session.total_committed?.toFixed(2) || '0'}</td>
                <td className="p-3">{new Date(session.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {session.status === 'draft' && (
                      <form action={async () => {
                        'use server';
                        await openSession(session.id);
                      }}>
                        <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                          Open
                        </button>
                      </form>
                    )}
                    
                    {session.status === 'open' && (
                      <form action={async () => {
                        'use server';
                        await closeCommitments(session.id);
                      }}>
                        <button className="px-3 py-1 bg-yellow-600 text-white rounded text-sm">
                          Close Commitments
                        </button>
                      </form>
                    )}
                    
                    {session.status === 'committed' && (
                      <form action={async () => {
                        'use server';
                        await startTrading(session.id);
                      }}>
                        <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                          Start Trading
                        </button>
                      </form>
                    )}
                    
                    {session.status === 'trading' && (
                      <Link
                        href={`/admin/sessions/${session.id}/end`}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                      >
                        End & Distribute
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}