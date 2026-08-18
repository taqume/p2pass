"use client";

import { CalendarDays, Check, Copy, ExternalLink, MapPin, ShieldCheck, Star, TicketCheck, Users } from "lucide-react";
import { motion } from "motion/react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import type { P2Event } from "@/lib/data";
import { formatEth, shortAddress } from "@/lib/utils";
import { EventRatingForm } from "./rating-form";
import { TransactionStatus } from "./transaction-status";
import { useUIPreferences } from "./ui-preferences";

export function EventDetailClient({ event }: { event: P2Event }) {
  const { text } = useUIPreferences();
  const { address } = useAccount();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const passRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "hasPass", args: address ? [BigInt(event.id), address] : undefined, query: { enabled: Boolean(address && contractsReady) } });
  const attendedRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "attended", args: address ? [BigInt(event.id), address] : undefined, query: { enabled: Boolean(address && contractsReady) } });
  const hasPass = passRead.data === true || receipt.isSuccess;

  const claim = () => writeContract({ address: contracts.core, abi: coreAbi, functionName: "joinEvent", args: [BigInt(event.id)], value: BigInt(Math.round(event.price * 1e18)) });
  const refund = () => writeContract({ address: contracts.core, abi: coreAbi, functionName: "claimRefund", args: [BigInt(event.id)] });

  return (
    <>
      <section className={`event-art tone-${event.tone} border-b border-white/10`}>
        <div className="event-art-grid" />
        <div className="shell relative z-10 flex min-h-[440px] flex-col justify-between py-12">
          <div className="flex items-center justify-between"><div className="eyebrow !text-white/70">{text({ en: "PUBLIC ADMISSION", tr: "HERKESE AÇIK GİRİŞ" })} · EVENT #{String(event.id).padStart(3,"0")}</div><span className="rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[10px] font-bold tracking-widest">BASE SEPOLIA</span></div>
          <div className="max-w-4xl"><div className="mb-5 flex flex-wrap gap-2">{event.tags.map(tag => <span key={tag} className="border border-white/15 px-2.5 py-1 text-xs text-white/70">{tag}</span>)}</div><h1 className="page-title max-w-4xl !text-[clamp(3rem,7vw,6.8rem)]">{event.name}</h1><p className="mt-5 max-w-2xl text-lg text-white/65">{event.summary}</p></div>
        </div>
      </section>

      <div className="shell grid gap-10 py-12 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="grid gap-0 border-y border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-white/10">
            <Info icon={<CalendarDays />} label={text({ en: "WHEN", tr: "ZAMAN" })} value={`${event.date} · ${event.time}`} />
            <Info icon={<MapPin />} label={text({ en: "WHERE", tr: "KONUM" })} value={event.location} />
            <Info icon={<Users />} label={text({ en: "CAPACITY", tr: "KAPASİTE" })} value={text({ en: `${event.registered} claimed · ${event.capacity - event.registered} left`, tr: `${event.registered} alındı · ${event.capacity - event.registered} kaldı` })} />
          </div>
          <section className="py-12"><div className="eyebrow">{text({ en: "ABOUT THIS EVENT", tr: "ETKİNLİK HAKKINDA" })}</div><p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{event.description}</p></section>
          <section className="border-t border-white/10 py-10">
            <div className="flex flex-wrap items-center justify-between gap-6"><div><div className="eyebrow">{text({ en: "ORGANIZED BY", tr: "ORGANİZATÖR" })}</div><div className="mono mt-3 flex items-center gap-2 text-sm">{shortAddress(event.organizer, 6)} <Copy size={13} className="text-slate-500" /></div></div><a className="btn-secondary" href={`https://sepolia.basescan.org/address/${event.organizer}`} target="_blank" rel="noreferrer">{text({ en: "View on BaseScan", tr: "BaseScan'de görüntüle" })} <ExternalLink size={14} /></a></div>
          </section>
          <section className="border-t border-white/10 py-10"><div className="flex items-end justify-between"><div><div className="eyebrow">{text({ en: "VERIFIED FEEDBACK", tr: "DOĞRULANMIŞ GERİ BİLDİRİM" })}</div><h2 className="section-title mt-3">{text({ en: "What attendees said", tr: "Katılımcılar ne dedi" })}</h2></div><div className="flex items-center gap-2 text-2xl font-semibold"><Star size={20} fill="#f59e0b" color="#f59e0b" /> {event.rating}</div></div><div className="mt-7 border-l-2 border-amber-400/50 pl-5 text-sm leading-7 text-slate-400">{text({ en: "Only wallets checked into this event can write or update a review. Reviews live entirely on-chain.", tr: "Yalnızca bu etkinlikte check-in yapmış cüzdanlar yorum yazabilir veya güncelleyebilir. Yorumlar tamamen on-chain yaşar." })}</div></section>
        </div>

        <aside className="lg:-mt-24">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="sticky top-24 border border-white/12 bg-[#111827] p-5 shadow-2xl shadow-black/25">
          <div className="flex items-center justify-between border-b border-dashed border-white/12 pb-4"><div><div className="eyebrow">{text({ en: "YOUR ADMISSION", tr: "KATILIMIN" })}</div><div className="mono mt-1 text-[10px] text-slate-500">{event.cancelled ? text({ en: "EVENT CANCELLED", tr: "ETKİNLİK İPTAL" }) : text({ en: "ONE PASS PER WALLET", tr: "HER CÜZDANA TEK PASS" })}</div></div><TicketCheck className={event.cancelled ? "text-red-400" : "text-[var(--brand)]"} /></div>
            <div className="py-6"><div className="text-3xl font-semibold tracking-[-.04em]">{event.price === 0 ? text({ en: "FREE", tr: "ÜCRETSİZ" }) : formatEth(event.price)}</div><p className="mt-2 text-sm text-slate-500">{text({ en: "Held in contract escrow until the event ends.", tr: "Etkinlik bitene kadar kontrat escrow'unda tutulur." })}</p></div>
            <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/8"><div className="h-full bg-[var(--brand)]" style={{ width: `${(event.registered/event.capacity)*100}%` }} /></div>
            {event.cancelled ? (event.price > 0 ? <button onClick={refund} disabled={!address || !contractsReady || isPending} className="btn-primary w-full !border-red-500 !bg-red-500">{text({ en: "Claim ticket refund", tr: "Bilet iadesini al" })}</button> : <div className="bg-red-500/8 p-3 text-sm font-semibold text-red-400">{text({ en: "Event cancelled · no payment was collected", tr: "Etkinlik iptal · ödeme alınmadı" })}</div>) : hasPass ? <div className="flex items-center gap-2 bg-green-500/8 p-3 text-sm font-semibold text-green-400"><Check size={16} /> {text({ en: "Pass active in your wallet", tr: "Pass cüzdanında aktif" })}</div> : <button onClick={claim} disabled={!address || !contractsReady || isPending} className="btn-primary w-full">{isPending ? text({ en: "Waiting for wallet", tr: "Cüzdan bekleniyor" }) : event.price ? text({ en: "Claim pass & pay", tr: "Pass al ve öde" }) : text({ en: "Claim free pass", tr: "Ücretsiz pass al" })}</button>}
            {!address && <p className="mt-3 text-center text-xs text-slate-500">{text({ en: "Connect your wallet to claim admission.", tr: "Katılım için cüzdanını bağla." })}</p>}
            {!contractsReady && <p className="mt-3 text-center text-xs text-amber-400">Preview mode · contract addresses not configured</p>}
            <TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} />
            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/8 pt-5 text-xs text-slate-500"><span className="flex items-center gap-2"><ShieldCheck size={14} /> Soulbound</span><span className="flex items-center gap-2"><Check size={14} /> On-chain proof</span></div>
            {attendedRead.data === true && <div className="mt-4 flex items-center gap-2 border border-green-500/20 p-3 text-xs font-bold tracking-wide text-green-400"><Check size={15} /> ACCESS VERIFIED · ATTENDED</div>}
          </motion.div>
          <div className="mt-5"><EventRatingForm eventId={event.id} /></div>
        </aside>
      </div>
    </>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex gap-3 py-5 sm:px-5 first:pl-0 last:pr-0 [&_svg]:mt-0.5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-[var(--brand)]"><span>{icon}</span><div><div className="eyebrow !text-slate-600">{label}</div><div className="mt-2 text-sm">{value}</div></div></div>;
}
