"use client";

import { CalendarPlus, Image as ImageIcon, Info, MapPin, Ticket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { useAccount, usePublicClient, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import { TransactionStatus } from "./transaction-status";
import { useUIPreferences } from "./ui-preferences";

export function CreateEventForm() {
  const { text } = useUIPreferences();
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
          <div className="mb-6 flex items-center gap-3 border-b border-white/8 pb-5"><CalendarPlus className="text-[var(--brand)]" size={20} /><div><h2 className="font-semibold">{text({ en: "Event identity", tr: "Etkinlik kimliği" })}</h2><p className="mt-1 text-xs text-slate-500">{text({ en: "Public details stored in the event registry.", tr: "Herkese açık bilgiler etkinlik kaydında saklanır." })}</p></div></div>
          <div className="grid gap-5">
            <div className="field"><label htmlFor="name">{text({ en: "Event name", tr: "Etkinlik adı" })}</label><input id="name" required maxLength={100} className="input" value={form.name} onChange={update("name")} placeholder="Protocol Dinner #08" /></div>
            <div className="field"><label htmlFor="description">{text({ en: "Description", tr: "Açıklama" })}</label><textarea id="description" required maxLength={1200} className="textarea" value={form.description} onChange={update("description")} placeholder={text({ en: "What will happen, and who should be in the room?", tr: "Ne olacak ve kimler orada olmalı?" })} /></div>
            <div className="field"><label htmlFor="image">{text({ en: "Event image IPFS URI", tr: "Etkinlik görseli IPFS URI" })}</label><div className="relative"><ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><input id="image" className="input !pl-10" value={form.imageURI} onChange={update("imageURI")} placeholder="ipfs://bafy…" /></div><span className="text-[11px] text-slate-500">{text({ en: "Upload through your IPFS provider, then paste the URI.", tr: "IPFS sağlayıcına yükleyip URI'yi buraya yapıştır." })}</span></div>
          </div>
        </section>

        <section className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-white/8 pb-5"><MapPin className="text-[var(--brand)]" size={20} /><div><h2 className="font-semibold">{text({ en: "Time & place", tr: "Zaman ve yer" })}</h2><p className="mt-1 text-xs text-slate-500">{text({ en: "Check-in is available only inside this time window.", tr: "Check-in yalnızca bu zaman aralığında yapılabilir." })}</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><div className="field sm:col-span-2"><label htmlFor="location">{text({ en: "Location", tr: "Konum" })}</label><input id="location" required className="input" value={form.location} onChange={update("location")} placeholder={text({ en: "Venue · City or online URL", tr: "Mekân · Şehir veya çevrimiçi adres" })} /></div><div className="field"><label htmlFor="start">{text({ en: "Starts", tr: "Başlangıç" })}</label><input id="start" required type="datetime-local" className="input" value={form.start} onChange={update("start")} /></div><div className="field"><label htmlFor="end">{text({ en: "Ends", tr: "Bitiş" })}</label><input id="end" required type="datetime-local" className="input" value={form.end} onChange={update("end")} /></div></div>
        </section>

        <section className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3 border-b border-white/8 pb-5"><Ticket className="text-[var(--brand)]" size={20} /><div><h2 className="font-semibold">{text({ en: "Admission", tr: "Katılım" })}</h2><p className="mt-1 text-xs text-slate-500">{text({ en: "Native ETH is held in escrow until the event ends.", tr: "Native ETH etkinlik bitene kadar escrow'da tutulur." })}</p></div></div>
          <div className="grid gap-5 sm:grid-cols-2"><div className="field"><label htmlFor="capacity">{text({ en: "Capacity · 0 means unlimited", tr: "Kapasite · 0 sınırsız demektir" })}</label><input id="capacity" min="0" required type="number" className="input" value={form.capacity} onChange={update("capacity")} /></div><div className="field"><label htmlFor="price">{text({ en: "Price in ETH · 0 means free", tr: "ETH fiyatı · 0 ücretsiz demektir" })}</label><input id="price" min="0" step="0.0001" required type="number" className="input" value={form.price} onChange={update("price")} /></div></div>
        </section>
      </div>

      <aside>
        <div className="sticky top-24 border border-white/12 bg-[#111827] p-5">
          <div className="eyebrow">{text({ en: "CREATION TRANSACTION", tr: "OLUŞTURMA İŞLEMİ" })}</div><h2 className="mt-3 text-xl font-semibold">{text({ en: "Publish on Base", tr: "Base üzerinde yayınla" })}</h2>
          <div className="my-6 space-y-3 border-y border-dashed border-white/12 py-5 text-sm"><div className="flex justify-between"><span className="text-slate-500">{text({ en: "Creation fee", tr: "Oluşturma ücreti" })}</span><span className="mono">{feeRead.data !== undefined ? `${Number(formatEther(feeRead.data)).toFixed(4)} ETH` : "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">{text({ en: "Estimated network fee", tr: "Tahmini ağ ücreti" })}</span><span className="mono text-xs">{estimate || "—"}</span></div><div className="flex justify-between"><span className="text-slate-500">{text({ en: "Protocol fee on tickets", tr: "Bilet protokol kesintisi" })}</span><span>2%</span></div></div>
          <div className="flex gap-2 text-xs leading-5 text-slate-500"><Info size={15} className="mt-0.5 shrink-0 text-[var(--brand)]" /> {text({ en: "All fields are public. Editing them later requires another transaction.", tr: "Tüm alanlar herkese açıktır. Daha sonra düzenlemek yeni bir işlem gerektirir." })}</div>
          <button type="submit" disabled={!address || !contractsReady || isPending} className="btn-primary mt-6 w-full">{isPending ? text({ en: "Check your wallet", tr: "Cüzdanını kontrol et" }) : text({ en: "Create on-chain event", tr: "On-chain etkinlik oluştur" })}</button>
          {!address && <p className="mt-3 text-center text-xs text-slate-500">{text({ en: "Connect your organizer wallet first.", tr: "Önce organizatör cüzdanını bağla." })}</p>}
          {!contractsReady && <p className="mt-3 text-center text-xs text-amber-400">Contract deployment is required.</p>}
          <TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} />
        </div>
      </aside>
    </form>
  );
}
