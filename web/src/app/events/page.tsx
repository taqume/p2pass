import type { Metadata } from "next";
import { OnchainEventList } from "@/components/onchain-event-list";
import { Localized } from "@/components/ui-preferences";
import { AmbientPage } from "@/components/ambient-page";

export const metadata: Metadata = { title: "Explore events" };

export default function EventsPage() {
  return (
    <AmbientPage variant="events"><div className="shell py-16">
      <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[1fr_auto] md:items-end">
        <div><div className="eyebrow"><Localized en="PUBLIC EVENT REGISTRY" tr="HERKESE AÇIK ETKİNLİK KAYDI" /></div><h1 className="page-title mt-4"><Localized en="Find your next shared history." tr="Sıradaki ortak hikâyeni bul." /></h1></div>
        <div className="flex items-center gap-2 text-xs text-slate-500"><span className="status-dot text-green-400" /> <Localized en="Reading Base Sepolia" tr="Base Sepolia okunuyor" /></div>
      </div>
      <OnchainEventList />
    </div></AmbientPage>
  );
}
