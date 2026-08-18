"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatEther } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, reputationAbi } from "@/lib/contracts";
import { TransactionStatus } from "./transaction-status";
import { useUIPreferences } from "./ui-preferences";

export function EventRatingForm({ eventId }: { eventId: number }) {
  const { text } = useUIPreferences();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [estimatedFee, setEstimatedFee] = useState<string>();
  const { address } = useAccount();
  const client = usePublicClient();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!address || !client || !contractsReady) return;
    const timer = window.setTimeout(async () => {
      try {
        const [gas, gasPrice] = await Promise.all([
          client.estimateContractGas({ address: contracts.reputation, abi: reputationAbi, functionName: "reviewEvent", args: [BigInt(eventId), rating, comment], account: address }),
          client.getGasPrice(),
        ]);
        setEstimatedFee(`${Number(formatEther(gas * gasPrice)).toFixed(7)} ETH`);
      } catch { setEstimatedFee(undefined); }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [address, client, comment, eventId, rating]);

  return (
    <div className="panel p-5">
      <div className="eyebrow">{text({ en: "ATTENDEE REVIEW", tr: "KATILIMCI DEĞERLENDİRMESİ" })}</div>
      <h3 className="mt-2 text-lg font-semibold">{text({ en: "Rate this event", tr: "Etkinliği değerlendir" })}</h3>
      <div className="my-5 flex gap-1" aria-label={`${rating} stars`}>
        {[1,2,3,4,5].map(value => <button key={value} onClick={() => setRating(value)} className="p-1" aria-label={`${value} stars`}><Star size={24} color={value <= rating ? "#f59e0b" : "#475569"} fill={value <= rating ? "#f59e0b" : "transparent"} /></button>)}
      </div>
      <textarea maxLength={500} value={comment} onChange={event => setComment(event.target.value)} className="textarea" placeholder={text({ en: "Optional on-chain comment…", tr: "İsteğe bağlı on-chain yorum…" })} />
      <div className="mt-2 flex justify-between text-[11px] text-slate-500"><span>{comment.length} / 500 bytes</span><span>{estimatedFee ? `${text({ en: "Estimated network fee", tr: "Tahmini ağ ücreti" })}: ${estimatedFee}` : address ? text({ en: "Estimating after 1s…", tr: "1 sn sonra hesaplanıyor…" }) : text({ en: "Connect to estimate gas", tr: "Gas tahmini için cüzdanı bağla" })}</span></div>
      <button disabled={!address || !contractsReady || isPending} className="btn-primary mt-4 w-full" onClick={() => writeContract({ address: contracts.reputation, abi: reputationAbi, functionName: "reviewEvent", args: [BigInt(eventId), rating, comment] })}>{text({ en: "Write review on-chain", tr: "Yorumu on-chain yayınla" })}</button>
      {!contractsReady && <p className="mt-3 text-xs text-amber-400">Add deployed contract addresses to enable transactions.</p>}
      <TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} />
    </div>
  );
}
