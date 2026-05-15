import { getAllDeposits } from "@/services/admin-deposit-service";

import { ApproveButton } from "@/components/admin/approve-button";
import { RejectButton } from "@/components/admin/reject-button";

export default async function AdminDepositsPage() {
  const deposits =
    await getAllDeposits();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Deposit Management
        </h1>
      </div>
<pre>
  {JSON.stringify(deposits.profile, null, 2)}
</pre>
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">
                User
              </th>

              <th className="px-4 py-3 text-left">
                Channel
              </th>

              <th className="px-4 py-3 text-left">
                Amount
              </th>

              <th className="px-4 py-3 text-left">
                Status
              </th>

              <th className="px-4 py-3 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {deposits.map((deposit) => (
              <tr
                key={deposit.id}
                className="border-b"
              >
                <td className="px-4 py-3">
                  {
                    deposit.user_email
                  }
                </td>

                <td className="px-4 py-3 capitalize">
                  {deposit.channel?.replace(
                    "_",
                    " "
                  )}
                </td>

                <td className="px-4 py-3">
                  ${deposit.amount}
                </td>

                <td className="px-4 py-3 capitalize">
                  {deposit.status}
                </td>

                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {deposit.status ===
                    "pending" ? (
                      <>
                        <ApproveButton
                          depositId={
                            deposit.id
                          }
                        />

                        <RejectButton
                          depositId={
                            deposit.id
                          }
                        />
                      </>
                    ) : (
                      <span>
                        Completed
                      </span>
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