"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { formatEther, type Address } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, reputationAbi } from "@/lib/contracts";
import { TransactionStatus } from "./transaction-status";

export function PeerRatingForm({ target }: { target: Address }) {
  const { address } = useAccount();
  const client = usePublicClient();
  const [eventId, setEventId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [estimate, setEstimate] = useState<string>();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!address || !client || !contractsReady || !eventId) return;
    const timer = window.setTimeout(async () => {
      try {
        const [gas, price] = await Promise.all([
          client.estimateContractGas({ address: contracts.reputation, abi: reputationAbi, functionName: "reviewPeer", args: [target, BigInt(eventId), rating, comment], account: address }),
          client.getGasPrice(),
        ]);
        setEstimate(`${Number(formatEther(gas * price)).toFixed(7)} ETH`);
      } catch { setEstimate(undefined); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [address, client, comment, eventId, rating, target]);

  return <div className="panel mt-5 p-5"><div className="eyebrow !text-violet-400">SHARED ATTENDANCE</div><h3 className="mt-2 font-semibold">Review this peer</h3><p className="mt-2 text-xs leading-5 text-slate-500">Choose an event where both wallets were checked in. The contract validates it directly.</p><div className="field mt-4"><label>Proof event ID</label><input value={eventId} onChange={e => setEventId(e.target.value)} inputMode="numeric" className="input mono" placeholder="42" /></div><div className="my-4 flex gap-1">{[1,2,3,4,5].map(value => <button key={value} onClick={() => setRating(value)}><Star size={21} color={value <= rating ? "#f59e0b" : "#475569"} fill={value <= rating ? "#f59e0b" : "transparent"} /></button>)}</div><textarea maxLength={500} value={comment} onChange={e => setComment(e.target.value)} className="textarea !min-h-24" placeholder="Optional on-chain comment…" /><div className="mt-2 flex justify-between text-[10px] text-slate-500"><span>{comment.length} / 500</span><span>{estimate ? `Est. fee ${estimate}` : "1s gas estimate"}</span></div><button disabled={!address || !eventId || !contractsReady || isPending} onClick={() => writeContract({ address: contracts.reputation, abi: reputationAbi, functionName: "reviewPeer", args: [target, BigInt(eventId), rating, comment] })} className="btn-primary mt-4 w-full">Publish peer review</button><TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} /></div>;
}

