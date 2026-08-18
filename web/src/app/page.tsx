import Link from "next/link";
import { ArrowDown, ArrowRight, Check, ScanLine, ShieldCheck, TicketCheck, Users } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { demoEvents } from "@/lib/data";

export default function Home() {
  return (
    <>
      <section className="shell grid min-h-[calc(100vh-72px)] items-center gap-14 py-16 lg:grid-cols-[1.08fr_.92fr] lg:py-20">
        <div>
          <div className="mb-8 flex items-center gap-3 text-xs text-slate-400"><span className="status-dot text-[#22c55e]" /> LIVE ON BASE SEPOLIA <span className="h-px w-8 bg-white/15" /> NO ACCOUNTS. JUST WALLETS.</div>
          <h1 className="display">Show up.<br /><span className="text-[#60a5fa]">Prove it.</span><br />Build trust.</h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">A shared event becomes an on-chain relationship. Claim your non-transferable pass, verify attendance, and unlock reputation that only real encounters can create.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/events" className="btn-primary">Explore events <ArrowRight size={16} /></Link>
            <Link href="/create" className="btn-secondary">Create an event</Link>
          </div>
          <a href="#events" className="mt-14 inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowDown size={15} /> UPCOMING ON-CHAIN</a>
        </div>

        <div className="relative lg:pl-7">
          <div className="absolute -left-6 top-10 hidden h-[72%] w-px bg-gradient-to-b from-transparent via-blue-400/40 to-transparent lg:block" />
          <div className="border border-white/12 bg-[#111827] p-4 shadow-2xl shadow-black/30">
            <div className="mb-4 flex items-center justify-between border-b border-dashed border-white/12 pb-4">
              <div><div className="eyebrow">P2PASS · ADMISSION</div><div className="mono mt-1 text-xs text-slate-500">TOKEN ID 000042</div></div>
              <span className="rounded-sm bg-green-500/10 px-2 py-1 text-[10px] font-bold tracking-widest text-green-400">PASS ACTIVE</span>
            </div>
            <div className="event-art tone-blue min-h-[320px] p-7">
              <div className="event-art-grid" />
              <div className="relative z-10 flex min-h-[265px] flex-col justify-between">
                <div className="flex justify-between"><span className="mono text-xs text-white/60">EVENT #042</span><TicketCheck className="text-[#60a5fa]" /></div>
                <div><div className="mb-3 text-xs font-semibold tracking-[.16em] text-blue-200/70">AUG 28 · ISTANBUL</div><h2 className="text-4xl font-semibold leading-none tracking-[-.05em]">Protocol<br />After Hours</h2></div>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-white/10 border-x border-b border-white/10">
              <div className="p-4"><div className="eyebrow !text-slate-600">OWNER</div><div className="mono mt-2 text-xs">0x72A4…9F31</div></div>
              <div className="p-4"><div className="eyebrow !text-slate-600">NETWORK</div><div className="mt-2 text-xs">BASE SEP</div></div>
              <div className="p-4"><div className="eyebrow !text-slate-600">STATUS</div><div className="mt-2 flex items-center gap-2 text-xs text-green-400"><Check size={13} /> VERIFIED</div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-white/[.018]">
        <div className="shell grid divide-y divide-white/8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {[
            [TicketCheck, "Pass proves access", "ERC-1155 passes cannot be transferred, sold or claimed twice."],
            [ScanLine, "Check-in proves presence", "Only the organizer and authorized scanners can verify attendance."],
            [Users, "Presence unlocks trust", "Only people who attended the same event can review one another."],
          ].map(([Icon, title, text]) => <div key={String(title)} className="py-8 md:px-8 first:pl-0 last:pr-0"><Icon className="mb-5 text-[#60a5fa]" size={22} /><h3 className="font-semibold">{String(title)}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{String(text)}</p></div>)}
        </div>
      </section>

      <section id="events" className="shell py-24">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="eyebrow">DISCOVER</div><h2 className="section-title mt-3">Upcoming encounters</h2></div><Link href="/events" className="text-sm font-semibold text-[#60a5fa]">View all events →</Link></div>
        <div className="grid gap-5"><EventCard event={demoEvents[0]} featured /><div className="grid gap-5 md:grid-cols-2"><EventCard event={demoEvents[1]} /><EventCard event={demoEvents[2]} /></div></div>
      </section>

      <section className="shell pb-10">
        <div className="grid gap-10 border-y border-white/10 py-14 md:grid-cols-[.8fr_1.2fr] md:items-center">
          <div><ShieldCheck className="text-[#8b5cf6]" /><h2 className="section-title mt-5">Reputation with<br />a reason to exist.</h2></div>
          <div className="grid gap-6 text-slate-400 sm:grid-cols-2"><p className="leading-7">No strangers farming stars. Every peer review points to an event where both wallets were checked in.</p><p className="leading-7">The proof event is passed directly to the contract, keeping validation focused and gas predictable.</p></div>
        </div>
      </section>
    </>
  );
}

