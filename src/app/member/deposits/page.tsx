import { DepositForm } from "@/components/member/deposit-form";
import { getCurrentUserDeposits } from "@/services/deposit-service";
import { CopyButton } from "@/components/member/copy-button";

export default async function DepositsPage() {
  const deposits = await getCurrentUserDeposits();

  const platformWalletAddress = "0xaf0f080cf37e3e056a70e1c59f8f1f9d505c789c";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deposits</h1>
        <p className="text-muted-foreground">Submit your deposits</p>
      </div>

      {/* Deposit Instructions */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">
          📋 Deposit Instructions
        </h2>

        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-blue-800">Step 1: Send USDT</p>
            <p className="text-gray-700 mt-1">
              Send USDT to the platform wallet address below:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-3 py-2 text-sm font-mono break-all border">
                {platformWalletAddress}
              </code>
              <CopyButton text={platformWalletAddress} />
            </div>
          </div>

          <div>
            <p className="font-medium text-blue-800">Step 2: Choose Network</p>
            <p className="text-gray-700 mt-1">
              Send using <strong>ERC20</strong>, <strong>BSC(BEP20)</strong> or <strong>TRC20</strong> networks only.
            </p>
            <div className="mt-1 text-yellow-700 text-xs">
              ⚠️ Sending on other networks may result in permanent loss of funds.
            </div>
          </div>

          <div>
            <p className="font-medium text-blue-800">Step 3: Minimum Deposit</p>
            <p className="text-gray-700 mt-1">
              Minimum deposit: <strong>5 USDT</strong>
            </p>
          </div>

          <div>
            <p className="font-medium text-blue-800">Step 4: Fill the Form</p>
            <p className="text-gray-700 mt-1">
              Complete the form below with your transaction details.
            </p>
          </div>

          <div>
            <p className="font-medium text-blue-800">Step 5: Wait for Confirmation</p>
            <p className="text-gray-700 mt-1">
              Admin will review and credit your wallet within 24 hours.
            </p>
          </div>
        </div>
      </div>

      <DepositForm />

      <div className="rounded-xl border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Channel</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
            </tr>
          </thead>

          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit.id} className="border-b">
                <td className="px-4 py-3">${deposit.amount}</td>
                <td className="px-4 py-3 capitalize">{deposit.channel}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      deposit.status === "confirmed"
                        ? "bg-green-100 text-green-800"
                        : deposit.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {deposit.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {new Date(deposit.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}