"use client";

import { useReadContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import type { P2Event } from "@/lib/data";
import { EventDetailClient } from "./event-detail-client";
import { chainEventToView } from "./onchain-event-list";

type ChainEvent = Parameters<typeof chainEventToView>[1];

export function EventRouteClient({ id, preview }: { id: number; preview?: P2Event }) {
  const read = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getEvent", args: [BigInt(id)], query: { enabled: contractsReady } });
  if (!contractsReady && preview) return <EventDetailClient event={preview} />;
  if (read.isLoading) return <div className="shell grid min-h-[70vh] place-items-center"><div className="text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" /><p className="mt-4 text-sm text-slate-500">Reading event #{id} from Base Sepolia…</p></div></div>;
  if (read.data) return <EventDetailClient event={chainEventToView(id, read.data as ChainEvent)} />;
  return <div className="shell grid min-h-[60vh] place-items-center text-center"><div><div className="eyebrow">EVENT NOT FOUND</div><h1 className="section-title mt-4">No on-chain event #{id}</h1><p className="mt-3 text-sm text-slate-500">Check the event ID or deployment configuration.</p></div></div>;
}

