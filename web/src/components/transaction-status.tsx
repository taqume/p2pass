"use client";

import { Check, CircleAlert, LoaderCircle, Radio, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Hash } from "viem";

type Props = { hash?: Hash; isPending?: boolean; isConfirming?: boolean; isSuccess?: boolean; error?: Error | null };

export function TransactionStatus({ hash, isPending, isConfirming, isSuccess, error }: Props) {
  const active = isPending || hash || error;
  if (!active) return null;
  const content = error
    ? { icon: <CircleAlert size={18} />, title: "Transaction failed", text: error.message.split("\n")[0], color: "text-red-400" }
    : isPending
      ? { icon: <Wallet size={18} />, title: "Waiting for wallet", text: "Review and confirm the request in your wallet.", color: "text-amber-400" }
      : isSuccess
        ? { icon: <Check size={18} />, title: "Confirmed on Base Sepolia", text: "Your on-chain state is now updated.", color: "text-green-400" }
        : isConfirming
          ? { icon: <LoaderCircle size={18} className="animate-spin" />, title: "Confirming on Base Sepolia", text: "Transaction submitted. Waiting for block confirmation.", color: "text-blue-400" }
          : { icon: <Radio size={18} />, title: "Transaction submitted", text: "Your transaction is now visible on the network.", color: "text-blue-400" };
  return (
    <AnimatePresence mode="wait">
      <motion.div key={content.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 border-l-2 border-current bg-white/[.025] p-4">
        <div className={`flex items-center gap-2 font-semibold ${content.color}`}>{content.icon}{content.title}</div>
        <p className="mt-1 break-words text-xs leading-5 text-slate-400">{content.text}</p>
        {hash && <a className="mono mt-2 block text-[10px] text-[#60a5fa] hover:underline" target="_blank" rel="noreferrer" href={`https://sepolia.basescan.org/tx/${hash}`}>{hash.slice(0, 18)}… · View on BaseScan ↗</a>}
      </motion.div>
    </AnimatePresence>
  );
}

