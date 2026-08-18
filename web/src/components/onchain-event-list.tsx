"use client";

import { useReadContract, useReadContracts } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import { demoEvents, type P2Event } from "@/lib/data";
import { EventCard } from "./event-card";
import { useUIPreferences } from "./ui-preferences";

type ChainEvent = {
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
    location: item.location, price: Number(item.price) / 1e18, capacity: item.capacity || Math.max(item.registered + 20, 100), registered: item.registered,
    organizer: item.organizer, imageURI: item.imageURI, tone: (["blue", "violet", "amber", "green"] as const)[id % 4], tags: [item.price === 0n ? "Free" : "Ticketed", "On-chain"], rating: 0, cancelled: item.cancelled,
  };
}

export function OnchainEventList() {
  const { text } = useUIPreferences();
  const count = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "eventCount", query: { enabled: contractsReady } });
  const total = Number(count.data ?? 0n);
  const reads = useReadContracts({ contracts: Array.from({ length: total }, (_, index) => ({ address: contracts.core, abi: coreAbi, functionName: "getEvent" as const, args: [BigInt(index + 1)] })) });
  const onchain = reads.data?.flatMap((result, index) => result.status === "success" && !(result.result as ChainEvent).cancelled ? [chainEventToView(index + 1, result.result as ChainEvent)] : []) ?? [];
  const events = contractsReady ? onchain : demoEvents;
  if (contractsReady && (count.isLoading || reads.isLoading)) return <div className="grid gap-5 md:grid-cols-2">{[0,1,2,3].map(i => <div key={i} className="h-[430px] animate-pulse border border-white/8 bg-white/[.025]" />)}</div>;
  if (events.length === 0) return <div className="panel p-12 text-center"><h2 className="font-semibold">{text({ en: "No public events yet", tr: "Henüz herkese açık etkinlik yok" })}</h2><p className="mt-2 text-sm text-slate-500">{text({ en: "Be the first organizer to publish one on Base Sepolia.", tr: "Base Sepolia'da ilk etkinliği yayınlayan organizatör ol." })}</p></div>;
  return <div className="grid gap-5 md:grid-cols-2">{events.map(event => <EventCard key={event.id} event={event} />)}</div>;
}
