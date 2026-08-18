import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import { OnchainEventList } from "@/components/onchain-event-list";
import { Localized } from "@/components/ui-preferences";

export const metadata: Metadata = { title: "Explore events" };

export default function EventsPage() {
  return (
    <div className="shell py-16">
      <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div><div className="eyebrow"><Localized en="PUBLIC EVENT REGISTRY" tr="HERKESE AÇIK ETKİNLİK KAYDI" /></div><h1 className="page-title mt-4"><Localized en="Find your next shared history." tr="Sıradaki ortak hikâyeni bul." /></h1></div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><span className="status-dot text-green-400" /> <Localized en="Reading Base Sepolia" tr="Base Sepolia okunuyor" /></div>
      </div>
      <div className="my-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only"><Localized en="Search events" tr="Etkinlik ara" /></span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={17} /><input className="input !pl-10" placeholder="Search / Ara" /></label>
        <button className="btn-secondary"><SlidersHorizontal size={16} /> <Localized en="Upcoming · All access" tr="Yaklaşan · Tüm etkinlikler" /></button>
      </div>
      <div className="mb-5 flex justify-between text-xs text-slate-500"><span><Localized en="Public event registry" tr="Herkese açık etkinlik kaydı" /></span><span className="mono"><Localized en="LATEST BLOCK" tr="SON BLOK" /></span></div>
      <OnchainEventList />
    </div>
  );
}
