import { DepositForm } from "@/components/member/deposit-form";

import { getCurrentUserDeposits } from "@/services/deposit-service";

export default async function DepositsPage() {
  const deposits =
    await getCurrentUserDeposits();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Deposits
        </h1>

        <p className="text-muted-foreground">
          Submit your deposits
        </p>
      </div>

      <DepositForm />

      <div className="rounded-xl border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">
                Amount
              </th>

               <th className="px-4 py-3 text-left">
                Channel
              </th>

              <th className="px-4 py-3 text-left">
                Status
              </th>

              <th className="px-4 py-3 text-left">
                Date
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
                  ${deposit.amount}
                </td>

                 <td className="px-4 py-3 capitalize">
                  {deposit.channel}
                </td>

                <td className="px-4 py-3 capitalize">
                  {deposit.status}
                </td>

                <td className="px-4 py-3">
                  {new Date(
                    deposit.created_at
                  ).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}