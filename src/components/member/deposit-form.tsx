"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

import { createDeposit } from "@/features/deposits/actions";

export function DepositForm() {
  const [channel, setChannel] =
    useState<"bank_transfer" | "crypto">(
      "bank_transfer"
    );

  const formRef =
    useRef<HTMLFormElement>(null);

  async function action(
    formData: FormData
  ) {
    const result =
      await createDeposit(formData);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(
      "Deposit submitted successfully"
    );

    formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-xl border p-6"
    >
      {/* CHANNEL SELECT */}
      <div>
        <label className="mb-2 block text-sm">
          Deposit Channel
        </label>

        <select
          name="channel"
          value={channel}
          onChange={(e) =>
            setChannel(
              e.target.value as any
            )
          }
          className="w-full rounded-md border px-4 py-3"
        >
          <option value="bank_transfer">
            Bank Transfer
          </option>

          <option value="crypto">
            Crypto
          </option>
        </select>
      </div>

      {/* AMOUNT */}
      <div>
        <label className="mb-2 block text-sm">
          Amount
        </label>

        <input
          name="amount"
          type="number"
          required
          className="w-full rounded-md border px-4 py-3"
        />
      </div>

      {/* BANK TRANSFER FIELDS */}
      {channel === "bank_transfer" && (
        <>
          <div>
            <label className="mb-2 block text-sm">
              Account Name
            </label>

            <input
              name="account_name"
              type="text"
              className="w-full rounded-md border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Bank Name
            </label>

            <input
              name="bank_name"
              type="text"
              className="w-full rounded-md border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Transaction Reference
            </label>

            <input
              name="reference"
              type="text"
              className="w-full rounded-md border px-4 py-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm">
              Payment Proof (Optional URL for now)
            </label>

            <input
              name="attachment_url"
              type="text"
              placeholder="Paste image URL (we will upgrade to upload later)"
              className="w-full rounded-md border px-4 py-3"
            />
          </div>
        </>
      )}

      {/* CRYPTO FIELDS */}
     {channel === "crypto" && (
  <div className="space-y-4">
    <div className="rounded-md bg-muted p-4 text-sm">
      Send crypto to platform wallet.
    </div>

    <div>
      <label className="mb-2 block text-sm">
        Network
      </label>

      <select
        name="crypto_network"
        className="w-full rounded-md border px-4 py-3"
      >
        <option value="TRC20">
          TRC20
        </option>

        <option value="ERC20">
          ERC20
        </option>

        <option value="BEP20">
          BEP20
        </option>
      </select>
    </div>

    <div>
      <label className="mb-2 block text-sm">
        Transaction Hash
      </label>

      <textarea
        name="tx_hash"
        required
        className="w-full rounded-md border px-4 py-3"
      />
    </div>

   
  </div>
)}

      <button
        type="submit"
        className="rounded-md bg-black px-6 py-3 text-white"
      >
        Submit Deposit
      </button>
    </form>
  );
}