"use client";

import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import { TransactionStatus } from "./transaction-status";

type EventTuple = { organizer: `0x${string}`; name: string; description: string; location: string; imageURI: string; startTime: bigint; endTime: bigint; capacity: number; registered: number; price: bigint; escrowed: bigint; cancelled: boolean; settled: boolean };
const empty = { name: "", description: "", location: "", imageURI: "", start: "", end: "", capacity: "0", price: "0" };

function localDate(seconds: bigint) {
  const date = new Date(Number(seconds) * 1000);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function EditEventForm({ eventId }: { eventId: number }) {
  const { address } = useAccount();
  const client = usePublicClient();
  const [form, setForm] = useState(empty);
  const [estimate, setEstimate] = useState<string>();
  const read = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getEvent", args: [BigInt(eventId)], query: { enabled: contractsReady } });
  const current = read.data as EventTuple | undefined;
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (!current) return;
    setForm({ name: current.name, description: current.description, location: current.location, imageURI: current.imageURI, start: localDate(current.startTime), end: localDate(current.endTime), capacity: String(current.capacity), price: formatEther(current.price) });
  }, [current]);

  const input = useMemo(() => ({ name: form.name, description: form.description, location: form.location, imageURI: form.imageURI, startTime: BigInt(form.start ? Math.floor(new Date(form.start).getTime() / 1000) : 0), endTime: BigInt(form.end ? Math.floor(new Date(form.end).getTime() / 1000) : 0), capacity: Number(form.capacity || 0), price: parseEther(form.price || "0") }), [form]);

  useEffect(() => {
    if (!address || !client || !contractsReady || !form.name || !form.start || !form.end) return;
    const timer = window.setTimeout(async () => {
      try {
        const [gas, price] = await Promise.all([client.estimateContractGas({ address: contracts.core, abi: coreAbi, functionName: "updateEvent", args: [BigInt(eventId), input], account: address }), client.getGasPrice()]);
        setEstimate(`${Number(formatEther(gas * price)).toFixed(7)} ETH`);
      } catch { setEstimate(undefined); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [address, client, eventId, form.end, form.name, form.start, input]);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(value => ({ ...value, [key]: event.target.value }));
  const isOrganizer = address && current?.organizer.toLowerCase() === address.toLowerCase();
  return <div className="shell max-w-4xl py-14"><Link href="/organize" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-white"><ArrowLeft size={15} /> Organizer workspace</Link><div className="mt-8 border-b border-white/10 pb-8"><div className="eyebrow">EVENT #{eventId} · UPDATE</div><h1 className="page-title mt-4 !text-[clamp(2.5rem,6vw,4.5rem)]">Edit on-chain details.</h1><p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">Updates are allowed only before the current start time. Price becomes locked after the first registration.</p></div>
    {!contractsReady ? <div className="mt-7 border-l-2 border-amber-400 bg-amber-400/5 p-4 text-sm text-amber-300">Deploy and configure contracts to edit a live event.</div> : read.isLoading ? <div className="py-16 text-center text-sm text-slate-500">Reading event from Base Sepolia…</div> : !isOrganizer ? <div className="mt-7 border-l-2 border-red-400 bg-red-400/5 p-4 text-sm text-red-300">Connect the organizer wallet that created this event.</div> : <form className="mt-8 grid gap-5" onSubmit={event => { event.preventDefault(); writeContract({ address: contracts.core, abi: coreAbi, functionName: "updateEvent", args: [BigInt(eventId), input] }); }}><div className="grid gap-5 sm:grid-cols-2"><div className="field sm:col-span-2"><label>Event name</label><input required className="input" value={form.name} onChange={update("name")} /></div><div className="field sm:col-span-2"><label>Description</label><textarea required className="textarea" value={form.description} onChange={update("description")} /></div><div className="field sm:col-span-2"><label>Location</label><input required className="input" value={form.location} onChange={update("location")} /></div><div className="field sm:col-span-2"><label>Event image IPFS URI</label><input className="input" value={form.imageURI} onChange={update("imageURI")} /></div><div className="field"><label>Starts</label><input required type="datetime-local" className="input" value={form.start} onChange={update("start")} /></div><div className="field"><label>Ends</label><input required type="datetime-local" className="input" value={form.end} onChange={update("end")} /></div><div className="field"><label>Capacity</label><input required min="0" type="number" className="input" value={form.capacity} onChange={update("capacity")} /></div><div className="field"><label>Ticket price · ETH</label><input required min="0" step="0.0001" type="number" className="input" value={form.price} onChange={update("price")} /></div></div><div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center"><div className="flex gap-2 text-xs text-slate-500"><Info size={14} /> Estimated network fee: <span className="mono text-slate-300">{estimate || "—"}</span></div><button disabled={isPending} className="btn-primary">Save changes on-chain</button></div><TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} /></form>}
  </div>;
}

