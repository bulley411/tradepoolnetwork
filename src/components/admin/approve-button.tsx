"use client";

import { toast } from "sonner";

import { approveDeposit } from "@/features/admin/actions";

export function ApproveButton({
  depositId,
}: {
  depositId: string;
}) {
  async function handleApprove() {
    const result =
      await approveDeposit(depositId);

    if (result?.error) {
      toast.error(result.error);

      return;
    }

    toast.success(
      "Deposit approved"
    );
  }

  return (
    <button
      onClick={handleApprove}
      className="rounded-md bg-green-600 px-4 py-2 text-white"
    >
      Approve
    </button>
  );
}