"use client";

import Link from "next/link";
import { Banknote, CalendarClock, CircleX, QrCode, ScanLine, ShieldPlus, Users } from "lucide-react";
import { useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import { shortAddress } from "@/lib/utils";
import { TransactionStatus } from "./transaction-status";
import { useUIPreferences } from "./ui-preferences";

export function OrganizerConsole() {
  const { text } = useUIPreferences();
  const { address } = useAccount();
  const created = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getCreatedEvents", args: address ? [address] : undefined, query: { enabled: Boolean(address && contractsReady) } });
  const ids = created.data?.map(Number) ?? (contractsReady ? [] : [42]);
  const [selected, setSelected] = useState<number>(ids[0] ?? 0);
  const eventId = selected || ids[0] || 0;
  const participants = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getParticipants", args: eventId ? [BigInt(eventId)] : undefined, query: { enabled: Boolean(eventId && contractsReady) } });

  if (!address) return <div className="panel p-12 text-center"><h2 className="text-xl font-semibold">{text({ en: "Organizer wallet required", tr: "Organizatör cüzdanı gerekli" })}</h2><p className="mt-2 text-sm text-slate-500">{text({ en: "Connect to read the events created by your address.", tr: "Adresinin oluşturduğu etkinlikleri görmek için cüzdanını bağla." })}</p></div>;
  if (ids.length === 0) return <div className="panel p-12 text-center"><h2 className="text-xl font-semibold">{text({ en: "No organizer events yet", tr: "Henüz oluşturduğun etkinlik yok" })}</h2><Link href="/create" className="btn-primary mt-5">{text({ en: "Create your first event", tr: "İlk etkinliğini oluştur" })}</Link></div>;

  return (
    <div className="grid gap-7 lg:grid-cols-[250px_1fr]">
      <aside className="border-r border-white/8 pr-5">
        <div className="eyebrow mb-4">{text({ en: "YOUR EVENTS", tr: "ETKİNLİKLERİN" })}</div>
        <div className="space-y-2">{ids.map(id => <button onClick={() => setSelected(id)} key={id} className={`w-full border-l-2 p-3 text-left ${eventId === id ? "border-amber-400 bg-amber-400/7" : "border-transparent hover:bg-white/[.025]"}`}><div className="text-sm font-semibold">{!contractsReady && id === 42 ? "Protocol After Hours" : `Event #${id}`}</div><div className="mono mt-1 text-[10px] text-slate-500">EVENT #{String(id).padStart(3,"0")}</div></button>)}</div>
        <Link href="/create" className="btn-secondary mt-5 w-full">+ {text({ en: "New event", tr: "Yeni etkinlik" })}</Link>
      </aside>

      <div>
        {!contractsReady && <div className="mb-5 border-l-2 border-amber-400 bg-amber-400/5 p-3 text-xs text-amber-300">Preview mode · actions unlock after deployment configuration.</div>}
        <div className="flex flex-wrap items-start justify-between gap-5 border-b border-white/10 pb-7"><div><div className="eyebrow">EVENT #{String(eventId).padStart(3,"0")} · {text({ en: "ORGANIZER CONTROL", tr: "ORGANİZATÖR KONTROLÜ" })}</div><h2 className="section-title mt-3">{!contractsReady ? "Protocol After Hours" : `On-chain event #${eventId}`}</h2><div className="mt-3 flex items-center gap-2 text-xs text-green-400"><span className="status-dot" /> {text({ en: "Registration open", tr: "Kayıt açık" })}</div></div><div className="flex gap-2"><Link href={`/events/${eventId}/edit`} className="btn-secondary">{text({ en: "Edit event", tr: "Etkinliği düzenle" })}</Link><Link href={`/scan?event=${eventId}`} className="btn-primary"><ScanLine size={16} /> {text({ en: "Open scanner", tr: "Tarayıcıyı aç" })}</Link></div></div>
        <div className="grid border-b border-white/10 sm:grid-cols-3 sm:divide-x sm:divide-white/10"><Metric icon={<Users />} label={text({ en: "REGISTERED", tr: "KAYITLI" })} value={String(participants.data?.length ?? 68)} meta={text({ en: "of 100 capacity", tr: "100 kapasiteden" })} /><Metric icon={<QrCode />} label={text({ en: "ATTENDED", tr: "KATILDI" })} value={!contractsReady ? "41" : "—"} meta={text({ en: "verified wallets", tr: "doğrulanmış cüzdan" })} /><Metric icon={<Banknote />} label="ESCROW" value={!contractsReady ? "0.204 ETH" : "On-chain"} meta={text({ en: "withdraws after event", tr: "etkinlik sonrası çekilir" })} /></div>

        <div className="grid gap-5 pt-7 md:grid-cols-2">
          <ScannerManager eventId={eventId} />
          <SettlementActions eventId={eventId} />
          <section className="panel p-5 md:col-span-2"><div className="mb-5 flex items-center justify-between"><div><div className="eyebrow">{text({ en: "PARTICIPANTS", tr: "KATILIMCILAR" })}</div><h3 className="mt-2 font-semibold">{text({ en: "Pass owners", tr: "Pass sahipleri" })}</h3></div><span className="mono text-xs text-slate-500">{participants.data?.length ?? 3} {text({ en: "WALLETS", tr: "CÜZDAN" })}</span></div><div className="divide-y divide-white/8 border-y border-white/8">{(participants.data ?? ["0x4412000000000000000000000000000000001A09", "0x8E010000000000000000000000000000000000C821", "0x2A70000000000000000000000000000000000093D4"]).slice(0,8).map((participant, index) => <div key={participant} className="flex items-center justify-between py-3 text-sm"><span className="mono text-xs">{shortAddress(participant, 7)}</span><span className={`text-[10px] font-bold tracking-wider ${index < 2 ? "text-green-400" : "text-slate-500"}`}>{index < 2 ? `✓ ${text({ en: "ATTENDED", tr: "KATILDI" })}` : "PASS ACTIVE"}</span></div>)}</div></section>
        </div>
      </div>
    </div>
  );
}

function ScannerManager({ eventId }: { eventId: number }) {
  const { text } = useUIPreferences();
  const [scanner, setScanner] = useState("");
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const update = (authorized: boolean) => writeContract({ address: contracts.core, abi: coreAbi, functionName: "setScanner", args: [BigInt(eventId), scanner as Address, authorized] });
  return <section className="panel p-5"><ShieldPlus className="text-[var(--brand)]" size={20} /><div className="eyebrow mt-4">{text({ en: "ACCESS CONTROL", tr: "ERİŞİM KONTROLÜ" })}</div><h3 className="mt-2 font-semibold">{text({ en: "Authorized scanners", tr: "Yetkili tarayıcılar" })}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{text({ en: "Grant or revoke a staff wallet’s permission to verify attendance.", tr: "Bir ekip cüzdanına katılım doğrulama yetkisi ver veya yetkiyi kaldır." })}</p><input value={scanner} onChange={event => setScanner(event.target.value)} className="input mono mt-5 text-xs" placeholder="0x scanner address" /><div className="mt-3 grid grid-cols-2 gap-2"><button disabled={!contractsReady || !isAddress(scanner) || isPending} onClick={() => update(true)} className="btn-secondary">{text({ en: "Authorize", tr: "Yetkilendir" })}</button><button disabled={!contractsReady || !isAddress(scanner) || isPending} onClick={() => update(false)} className="btn-quiet !text-red-400">{text({ en: "Revoke", tr: "Yetkiyi kaldır" })}</button></div><TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} /></section>;
}

function SettlementActions({ eventId }: { eventId: number }) {
  const { text } = useUIPreferences();
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const call = (fn: "withdrawProceeds" | "cancelEvent") => writeContract({ address: contracts.core, abi: coreAbi, functionName: fn, args: [BigInt(eventId)] });
  return <section className="panel p-5"><CalendarClock className="text-[var(--brand)]" size={20} /><div className="eyebrow mt-4">{text({ en: "SETTLEMENT", tr: "ÖDEME" })}</div><h3 className="mt-2 font-semibold">{text({ en: "Event lifecycle", tr: "Etkinlik yaşam döngüsü" })}</h3><p className="mt-2 text-xs leading-5 text-slate-500">{text({ en: "After the end time, withdraw proceeds minus the 2% protocol fee. Cancellation enables participant refunds.", tr: "Bitişten sonra %2 protokol kesintili geliri çek. İptal, katılımcı iadelerini açar." })}</p><button disabled={!contractsReady || isPending} onClick={() => call("withdrawProceeds")} className="btn-primary mt-5 w-full"><Banknote size={15} /> {text({ en: "Withdraw proceeds", tr: "Geliri çek" })}</button><button disabled={!contractsReady || isPending} onClick={() => call("cancelEvent")} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-red-400 hover:bg-red-400/5"><CircleX size={14} /> {text({ en: "Cancel event", tr: "Etkinliği iptal et" })}</button><TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} /></section>;
}

function Metric({ icon, label, value, meta }: { icon: React.ReactNode; label: string; value: string; meta: string }) { return <div className="flex gap-4 py-6 sm:px-6 first:pl-0 last:pr-0 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-[var(--brand)]"><span>{icon}</span><div><div className="eyebrow !text-slate-600">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div><div className="mt-1 text-[11px] text-slate-600">{meta}</div></div></div>; }
