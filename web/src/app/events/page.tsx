import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import { OnchainEventList } from "@/components/onchain-event-list";

export const metadata: Metadata = { title: "Explore events" };

export default function EventsPage() {
  return (
    <div className="shell py-16">
      <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div><div className="eyebrow">PUBLIC EVENT REGISTRY</div><h1 className="page-title mt-4">Find your next<br />shared history.</h1></div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><span className="status-dot text-green-400" /> Reading Base Sepolia</div>
      </div>
      <div className="my-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Search events</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><input className="input !pl-10" placeholder="Search by event or location" /></label>
        <button className="btn-secondary"><SlidersHorizontal size={16} /> Upcoming · All access</button>
      </div>
      <div className="mb-5 flex justify-between text-xs text-slate-500"><span>Public event registry</span><span className="mono">LATEST BLOCK</span></div>
      <OnchainEventList />
    </div>
  );
}
