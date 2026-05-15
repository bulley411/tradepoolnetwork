"use client";

import { toast } from "sonner";

import { rejectDeposit } from "@/features/admin/actions";

export function RejectButton({
  depositId,
}: {
  depositId: string;
}) {
  async function handleReject() {
    const result =
      await rejectDeposit(depositId);

    if (result?.error) {
      toast.error(result.error);

      return;
    }

    toast.success(
      "Deposit rejected"
    );
  }

  return (
    <button
      onClick={handleReject}
      className="rounded-md bg-red-600 px-4 py-2 text-white"
    >
      Reject
    </button>
  );
}