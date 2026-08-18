"use client";

import { CalendarPlus, Image as ImageIcon, Info, MapPin, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import { TransactionStatus } from "./transaction-status";

export function CreateEventForm() {
  const [form, setForm] = useState({ name: "", description: "", location: "", imageURI: "", start: "", end: "", capacity: "100", price: "0" });
  const [estimate, setEstimate] = useState<string>();
  const { address } = useAccount();
  const client = usePublicClient();
  const feeRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "creationFee", query: { enabled: contractsReady } });
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const input = useMemo(() => ({
    name: form.name,
    description: form.description,
    location: form.location,
    imageURI: form.imageURI,
    startTime: BigInt(form.start ? Math.floor(new Date(form.start).getTime() / 1000) : 0),
    endTime: BigInt(form.end ? Math.floor(new Date(form.end).getTime() / 1000) : 0),
    capacity: Number(form.capacity || 0),
    price: parseEther(form.price || "0"),
  }), [form]);

  useEffect(() => {
    if (!address || !client || !contractsReady || !form.name || !form.start || !form.end) return;
    const timer = window.setTimeout(async () => {
      try {
        const [gas, gasPrice] = await Promise.all([
          client.estimateContractGas({ address: contracts.core, abi: coreAbi, functionName: "createEvent", args: [input], value: feeRead.data ?? 0n, account: address }),
          client.getGasPrice(),
        ]);
        setEstimate(`${Number(formatEther(gas * gasPrice)).toFixed(7)} ETH`);
      } catch { setEstimate(undefined); }
    }, 1000);
    return () => clearTimeout(timer);
  }, [address, client, feeRead.data, form.end, form.name, form.start, input]);

  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(current => ({ ...current, [key]: event.target.value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    writeContract({ address: contracts.core, abi: coreAbi, functionName: "createEvent", args: [input], value: feeRead.data ?? 0n });
  };

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_330px]">
      <div className="space-y-9">
        <section className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-white/8 pb-5"><CalendarPlus className="text-[#60a5fa]" size={20} /><div><h2 className="font-semibold">Event identity</h2><p className="mt-1 text-xs text-slate-500">Public details stored in the event registry.</p></div></div>
          <div className="grid gap-5">
            <div className="field"><label htmlFor="name">Event name</label><input id="name" required maxLength={100} className="input" value={form.name} onChange={update("name")} placeholder="Protocol Dinner #08" /></div>
            <div className="field"><label htmlFor="description">Description</label><textarea id="description" required maxLength={1200} className="textarea" value={form.description} onChange={update("description")} placeholder="What will happen, and who should be in the room?" /></div>
            <div className="field"><label htmlFor="image">Event image IPFS URI</label><div className="relative"><ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input id="image" className="input !pl-10" value={form.imageURI} onChange={update("imageURI")} placeholder="ipfs://bafy…" /></div><span className="text-[11px] text-slate-500">Upload through your preferred IPFS pinning provider, then paste the URI.</span></div>
          </div>
        </section>

        <section className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-white/8 pb-5"><MapPin className="text-[#60a5fa]" size={20} /><div><h2 className="font-semibold">Time & place</h2><p className="mt-1 text-xs text-slate-500">Check-in is available only inside this time window.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><div className="field sm:col-span-2"><label htmlFor="location">Location</label><input id="location" required className="input" value={form.location} onChange={update("location")} placeholder="Venue · City or online URL" /></div><div className="field"><label htmlFor="start">Starts</label><input id="start" required type="datetime-local" className="input" value={form.start} onChange={update("start")} /></div><div className="field"><label htmlFor="end">Ends</label><input id="end" required type="datetime-local" className="input" value={form.end} onChange={update("end")} /></div></div>
        </section>

        <section className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-white/8 pb-5"><Ticket className="text-[#60a5fa]" size={20} /><div><h2 className="font-semibold">Admission</h2><p className="mt-1 text-xs text-slate-500">Native ETH is held in escrow until the event ends.</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><div className="field"><label htmlFor="capacity">Capacity · 0 means unlimited</label><input id="capacity" min="0" required type="number" className="input" value={form.capacity} onChange={update("capacity")} /></div><div className="field"><label htmlFor="price">Price in ETH · 0 means free</label><input id="price" min="0" step="0.0001" required type="number" className="input" value={form.price} onChange={update("price")} /></div></div>
        </section>
      </div>

      <aside>
        <div className="sticky top-24 border border-white/12 bg-[#111827] p-5">
          <div className="eyebrow">CREATION TRANSACTION</div><h2 className="mt-3 text-xl font-semibold">Publish on Base</h2>
          <div className="my-6 space-y-3 border-y border-dashed border-white/12 py-5 text-sm"><div className="flex justify-between"><span className="text-slate-500">Creation fee</span><span className="mono">{feeRead.data !== undefined ? `${Number(formatEther(feeRead.data)).toFixed(4)} ETH` : "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Estimated network fee</span><span className="mono text-xs">{estimate || "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">Protocol fee on tickets</span><span>2%</span></div></div>
          <div className="flex gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0 text-[#60a5fa]" /> All fields are public. Editing them later requires another transaction.</div>
          <button type="submit" disabled={!address || !contractsReady || isPending} className="btn-primary mt-6 w-full">{isPending ? "Check your wallet" : "Create on-chain event"}</button>
          {!address && <p className="mt-3 text-center text-xs text-slate-500">Connect your organizer wallet first.</p>}
          {!contractsReady && <p className="mt-3 text-center text-xs text-amber-400">Contract deployment is required.</p>}
          <TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} />
        </div>
      </aside>
    </form>
  );
}

