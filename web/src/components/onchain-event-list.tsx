"use client";

import { Check, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useReadContract, useReadContracts } from "wagmi";
import { contracts, contractsReady, coreAbi, reputationAbi } from "@/lib/contracts";
import type { P2Event } from "@/lib/data";
import { EventCard } from "./event-card";
import { useUIPreferences } from "./ui-preferences";

export type ChainEvent = {
  organizer: `0x${string}`; name: string; description: string; location: string; imageURI: string;
  startTime: bigint; endTime: bigint; capacity: number; registered: number; price: bigint; escrowed: bigint; cancelled: boolean; settled: boolean;
};

export function chainEventToView(id: number, item: ChainEvent): P2Event {
  const start = new Date(Number(item.startTime) * 1000);
  const end = new Date(Number(item.endTime) * 1000);
  return {
    id, name: item.name, summary: item.description.slice(0, 130), description: item.description,
    date: start.toLocaleDateString("en-US", { month: "short", day: "2-digit" }).toUpperCase(),
    time: `${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} — ${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`,
    startTime: Number(item.startTime), endTime: Number(item.endTime),
    location: item.location, price: Number(item.price) / 1e18, priceWei: item.price, capacity: item.capacity, registered: item.registered,
    organizer: item.organizer, imageURI: item.imageURI, tone: (["blue", "violet", "amber", "green"] as const)[id % 4], tags: [item.price === 0n ? "Free" : "Ticketed", "On-chain"], rating: 0, cancelled: item.cancelled, settled: item.settled,
  };
}

export function OnchainEventList() {
  const { text } = useUIPreferences();
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState<"all" | "free" | "paid">("all");
  const [hideEnded, setHideEnded] = useState(false);
  const count = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "eventCount", query: { enabled: contractsReady } });
  const total = Number(count.data ?? 0n);
  const eventReads = useReadContracts({
    contracts: Array.from({ length: total }, (_, index) => ({ address: contracts.core, abi: coreAbi, functionName: "getEvent" as const, args: [BigInt(index + 1)] })),
    query: { enabled: contractsReady && total > 0 },
  });
  const ratingReads = useReadContracts({
    contracts: Array.from({ length: total }, (_, index) => ({ address: contracts.reputation, abi: reputationAbi, functionName: "eventAverage" as const, args: [BigInt(index + 1)] })),
    query: { enabled: contractsReady && total > 0 },
  });
  const events = useMemo(() => eventReads.data?.flatMap((result, index) => {
    if (result.status !== "success" || (result.result as ChainEvent).cancelled) return [];
    const event = chainEventToView(index + 1, result.result as ChainEvent);
    const ratingResult = ratingReads.data?.[index];
    event.rating = ratingResult?.status === "success" ? Number(ratingResult.result) / 100 : 0;
    return [event];
  }) ?? [], [eventReads.data, ratingReads.data]);
  const orderedEvents = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return [...events].sort((a, b) => {
      const aEnded = a.endTime < now;
      const bEnded = b.endTime < now;
      if (aEnded !== bEnded) return aEnded ? 1 : -1;
      return aEnded ? b.endTime - a.endTime : a.startTime - b.startTime;
    });
  }, [events]);
  const visibleEvents = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const now = Math.floor(Date.now() / 1000);
    return orderedEvents.filter(event => {
      const matchesQuery = !needle || `${event.name} ${event.description} ${event.location}`.toLocaleLowerCase().includes(needle);
      const matchesAccess = access === "all" || (access === "free" ? event.price === 0 : event.price > 0);
      const matchesStatus = !hideEnded || event.endTime >= now;
      return matchesQuery && matchesAccess && matchesStatus;
    });
  }, [access, hideEnded, orderedEvents, query]);

  if (!contractsReady) return <div className="panel p-12 text-center"><h2 className="font-semibold">{text({ en: "Contract configuration required", tr: "Kontrat yapılandırması gerekli" })}</h2><p className="mt-2 text-sm text-slate-500">{text({ en: "No demo events are substituted for an unavailable deployment.", tr: "Ulaşılamayan deployment yerine demo etkinlik gösterilmez." })}</p></div>;
  if (count.isLoading || eventReads.isLoading) return <div className="grid gap-5 md:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-[430px] animate-pulse border border-white/8 bg-white/[.025]" />)}</div>;
  if (count.isError || eventReads.isError) return <div className="panel p-12 text-center"><h2 className="font-semibold">{text({ en: "Base Sepolia could not be read", tr: "Base Sepolia okunamadı" })}</h2><p className="mt-2 text-sm text-slate-500">{text({ en: "Check the RPC connection and try again.", tr: "RPC bağlantısını kontrol edip tekrar dene." })}</p></div>;

  return <>
    <div className="my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(260px,1fr)_auto_auto]">
      <label className="relative flex-1"><span className="sr-only">{text({ en: "Search events", tr: "Etkinlik ara" })}</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><input value={query} onChange={event => setQuery(event.target.value)} className="input !pl-10" placeholder={text({ en: "Search events", tr: "Etkinlik ara" })} /></label>
      <label className="relative"><span className="sr-only">{text({ en: "Filter by access", tr: "Giriş türüne göre filtrele" })}</span><SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} /><select value={access} onChange={event => setAccess(event.target.value as typeof access)} className="input min-w-52 !pl-10"><option value="all">{text({ en: "All access", tr: "Tüm etkinlikler" })}</option><option value="free">{text({ en: "Free", tr: "Ücretsiz" })}</option><option value="paid">{text({ en: "Paid", tr: "Ücretli" })}</option></select></label>
      <label className={`ended-filter ${hideEnded ? "is-active" : ""}`}><input type="checkbox" checked={hideEnded} onChange={event => setHideEnded(event.target.checked)} /><span className="ended-filter-box"><Check size={13} /></span><span>{text({ en: "Hide ended events", tr: "Bitmiş etkinlikleri gizle" })}</span></label>
    </div>
    <div className="mb-5 flex justify-between text-xs text-slate-500"><span>{text({ en: `${visibleEvents.length} on-chain event${visibleEvents.length === 1 ? "" : "s"} · nearest first`, tr: `${visibleEvents.length} on-chain etkinlik · en yakın tarih önce` })}</span><span className="mono">BASE SEPOLIA</span></div>
    {events.length === 0 ? <div className="panel p-12 text-center"><h2 className="font-semibold">{text({ en: "No public events yet", tr: "Henüz herkese açık etkinlik yok" })}</h2><p className="mt-2 text-sm text-slate-500">{text({ en: "Be the first organizer to publish one on Base Sepolia.", tr: "Base Sepolia'da ilk etkinliği yayınlayan organizatör ol." })}</p></div> : visibleEvents.length === 0 ? <div className="panel p-12 text-center"><h2 className="font-semibold">{text({ en: "No matching events", tr: "Eşleşen etkinlik yok" })}</h2><p className="mt-2 text-sm text-slate-500">{text({ en: "Try a different search or access filter.", tr: "Farklı bir arama veya giriş filtresi dene." })}</p></div> : <div className="grid gap-5 md:grid-cols-2">{visibleEvents.map(event => <EventCard key={event.id} event={event} ended={event.endTime < Math.floor(Date.now() / 1000)} />)}</div>}
  </>;
}
