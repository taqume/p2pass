"use client";

import { useReadContract } from "wagmi";
import { contracts, contractsReady, coreAbi, reputationAbi } from "@/lib/contracts";
import { EventDetailClient } from "./event-detail-client";
import { chainEventToView } from "./onchain-event-list";
import { useUIPreferences } from "./ui-preferences";

type ChainEvent = Parameters<typeof chainEventToView>[1];

export function EventRouteClient({ id }: { id: number }) {
  const { text } = useUIPreferences();
  const read = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getEvent", args: [BigInt(id)], query: { enabled: contractsReady } });
  const ratingRead = useReadContract({ address: contracts.reputation, abi: reputationAbi, functionName: "eventAverage", args: [BigInt(id)], query: { enabled: contractsReady } });
  if (!contractsReady) return <div className="shell grid min-h-[60vh] place-items-center text-center"><div><div className="eyebrow">BASE SEPOLIA</div><h1 className="section-title mt-4">{text({ en: "Contract configuration required", tr: "Kontrat yapılandırması gerekli" })}</h1><p className="mt-3 text-sm text-slate-500">{text({ en: "P2Pass does not substitute demo data when a live deployment is unavailable.", tr: "Canlı deployment mevcut değilse P2Pass demo veri göstermez." })}</p></div></div>;
  if (read.isLoading) return <div className="shell grid min-h-[70vh] place-items-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /><p className="mt-4 text-sm text-slate-500">{text({ en: `Reading event #${id} from Base Sepolia…`, tr: `Base Sepolia'dan #${id} etkinliği okunuyor…` })}</p></div></div>;
  if (read.data) {
    const event = chainEventToView(id, read.data as ChainEvent);
    event.rating = ratingRead.data ? Number(ratingRead.data) / 100 : 0;
    return <EventDetailClient event={event} />;
  }
  return <div className="shell grid min-h-[60vh] place-items-center text-center"><div><div className="eyebrow">{text({ en: "EVENT NOT FOUND", tr: "ETKİNLİK BULUNAMADI" })}</div><h1 className="section-title mt-4">{text({ en: `No on-chain event #${id}`, tr: `#${id} numaralı on-chain etkinlik yok` })}</h1><p className="mt-3 text-sm text-slate-500">{text({ en: "Check the event ID or deployment configuration.", tr: "Etkinlik kimliğini veya deployment ayarlarını kontrol et." })}</p></div></div>;
}
