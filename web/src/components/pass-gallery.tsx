"use client";

import Link from "next/link";
import { Check, QrCode, TicketCheck, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import { demoEvents } from "@/lib/data";
import { shortAddress } from "@/lib/utils";
import { useUIPreferences } from "./ui-preferences";

export function PassGallery() {
  const { text } = useUIPreferences();
  const { address } = useAccount();
  const [selected, setSelected] = useState<number>();
  const joined = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getJoinedEvents", args: address ? [address] : undefined, query: { enabled: Boolean(address && contractsReady) } });
  const ids = joined.data?.map(Number) ?? (contractsReady ? [] : demoEvents.slice(0, 2).map(event => event.id));

  if (!address) return <div className="panel grid min-h-72 place-items-center p-8 text-center"><div><Wallet className="mx-auto text-[var(--brand)]" /><h2 className="mt-4 text-xl font-semibold">{text({ en: "Connect your wallet", tr: "Cüzdanını bağla" })}</h2><p className="mt-2 text-sm text-slate-500">{text({ en: "Your pass IDs are read directly from the EventPass contract.", tr: "Pass kimliklerin doğrudan EventPass kontratından okunur." })}</p></div></div>;
  return (
    <>
      {!contractsReady && <div className="mb-5 border-l-2 border-amber-400 bg-amber-400/5 p-3 text-xs text-amber-300">{text({ en: "Preview mode shows sample passes. Configure deployed addresses to load wallet ownership.", tr: "Önizleme modu örnek pass'leri gösterir. Cüzdan sahipliğini yüklemek için kontrat adreslerini ayarla." })}</div>}
      {ids.length === 0 ? <div className="panel p-12 text-center"><TicketCheck className="mx-auto text-slate-600" /><h2 className="mt-4 font-semibold">{text({ en: "No passes yet", tr: "Henüz pass yok" })}</h2><Link href="/events" className="mt-3 inline-block text-sm text-[var(--brand)]">{text({ en: "Explore events", tr: "Etkinlikleri keşfet" })} →</Link></div> : <div className="grid gap-5 md:grid-cols-2">{ids.map((id) => {
        const event = demoEvents.find(item => item.id === id);
        return <article key={id} className="ticket-notch grid overflow-hidden border border-white/10 bg-[#111827] grid-cols-[1fr_116px]"><div className={`event-art tone-${event?.tone ?? "blue"} p-5`}><div className="event-art-grid" /><div className="relative z-10 flex min-h-48 flex-col justify-between"><div><div className="eyebrow !text-white/65">EVENT #{String(id).padStart(3,"0")}</div><span className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 px-2 py-1 text-[10px] font-bold text-green-400"><Check size={11} /> PASS ACTIVE</span></div><div><h2 className="text-2xl font-semibold tracking-[-.04em]">{event?.name ?? `On-chain event #${id}`}</h2><p className="mt-2 text-xs text-white/55">{event?.date ?? "BASE SEPOLIA"} · {event?.location ?? "Public registry"}</p></div></div></div><button onClick={() => setSelected(id)} className="flex flex-col items-center justify-center gap-3 border-l border-dashed border-white/12 text-slate-400 hover:bg-white/[.025] hover:text-white"><QrCode /><span className="text-[10px] font-bold tracking-widest">CHECK-IN QR</span></button></article>;
      })}</div>}
      <AnimatePresence>{selected && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(undefined)} className="fixed inset-0 z-[70] grid place-items-center bg-[#050914]/85 p-5 backdrop-blur-md"><motion.div initial={{ scale: .96, y: 12 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} className="w-full max-w-sm bg-white p-6 text-[#0f172a]"><div className="flex justify-between"><div><div className="mono text-[10px] font-bold tracking-widest text-amber-600">P2PASS CHECK-IN</div><h2 className="mt-1 text-xl font-bold">Event #{selected}</h2></div><TicketCheck /></div><div className="my-7 grid place-items-center"><QRCodeSVG value={`p2pass:84532:${selected}:${address}`} size={236} level="H" /></div><div className="border-t border-dashed border-slate-300 pt-4 text-center"><div className="mono text-xs">{shortAddress(address, 7)}</div><p className="mt-2 text-xs text-slate-500">{text({ en: "Show this code to an authorized event scanner.", tr: "Bu kodu yetkili etkinlik tarayıcısına göster." })}</p></div></motion.div></motion.div>}</AnimatePresence>
    </>
  );
}
