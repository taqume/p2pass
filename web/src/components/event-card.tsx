"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { motion } from "motion/react";
import type { P2Event } from "@/lib/data";
import { cn, formatEth, shortAddress } from "@/lib/utils";
import { useUIPreferences } from "./ui-preferences";

export function EventCard({ event, featured = false }: { event: P2Event; featured?: boolean }) {
  const { text } = useUIPreferences();
  return (
    <motion.article whileHover={{ y: -4 }} transition={{ duration: .2 }} className={cn("ticket-notch overflow-hidden border border-white/10 bg-[#111827]", featured && "lg:grid lg:grid-cols-[1.35fr_.65fr]")}>
      <Link href={`/events/${event.id}`} className={cn("event-art block min-h-48 p-5", `tone-${event.tone}`, featured && "lg:min-h-[380px] lg:p-8")}>
        <div className="event-art-grid" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-14">
          <div className="flex items-start justify-between">
            <span className="eyebrow !text-white/70">EVENT #{String(event.id).padStart(3, "0")}</span>
            <span className="rounded-full border border-white/15 bg-black/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white/80">BASE SEPOLIA</span>
          </div>
          <div>
            <div className="mb-3 flex flex-wrap gap-2">{event.tags.map(tag => <span key={tag} className="text-xs text-white/65">#{(tag === "Free" ? text({ en: "free", tr: "ücretsiz" }) : tag === "Ticketed" ? text({ en: "ticketed", tr: "ücretli" }) : tag).toLowerCase().replace(" ", "-")}</span>)}</div>
            <h3 className={cn("max-w-2xl text-[1.7rem] font-semibold leading-[1.02] tracking-[-.045em]", featured && "text-[clamp(2.2rem,4vw,4rem)]")}>{event.name}</h3>
          </div>
        </div>
      </Link>
      <div className={cn("relative flex flex-col justify-between border-t border-dashed border-white/15 p-5 lg:border-l lg:border-t-0", featured && "lg:p-7")}>
        <div>
          <div className="flex items-start justify-between gap-4">
            <div><div className="text-2xl font-semibold tracking-[-.04em]">{event.date}</div><div className="mt-1 text-xs text-slate-500">{event.time}</div></div>
            <span className="flex items-center gap-1 text-sm"><Star size={14} fill="#f59e0b" color="#f59e0b" /> {event.rating > 0 ? event.rating.toFixed(1) : text({ en: "New", tr: "Yeni" })}</span>
          </div>
          <p className="mt-6 text-sm leading-6 text-slate-400">{event.summary}</p>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><MapPin size={14} /> {event.location}</div>
        </div>
        <div className="mt-8 border-t border-white/8 pt-5">
          <div className="mb-4 flex items-end justify-between">
            <div><div className="eyebrow !text-slate-600">{text({ en: "ENTRY", tr: "GİRİŞ" })}</div><div className="mt-1 font-semibold">{event.price === 0 ? text({ en: "FREE", tr: "ÜCRETSİZ" }) : formatEth(event.price)}</div></div>
            <div className="text-right"><div className="eyebrow !text-slate-600">{text({ en: "CLAIMED", tr: "ALINAN" })}</div><div className="mono mt-1 text-sm">{event.registered} / {event.capacity === 0 ? "∞" : event.capacity}</div></div>
          </div>
          <Link href={`/events/${event.id}`} className="flex items-center justify-between text-sm font-semibold text-[var(--brand)]">{text({ en: "View admission", tr: "Etkinliği görüntüle" })} <ArrowUpRight size={16} /></Link>
          <div className="mono mt-3 text-[10px] text-slate-600">{text({ en: "HOST", tr: "ORGANİZATÖR" })} {shortAddress(event.organizer)}</div>
        </div>
      </div>
    </motion.article>
  );
}
