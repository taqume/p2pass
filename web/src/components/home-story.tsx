"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Coins, Fingerprint, ScanLine, ShieldCheck, TicketCheck, UserRoundX } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { useUIPreferences } from "./ui-preferences";

type StorySectionProps = {
  index: number;
  eyebrow: { en: string; tr: string };
  title: React.ReactNode;
  body: string;
  children: React.ReactNode;
  onVisible: (index: number) => void;
};

function StorySection({ index, eyebrow, title, body, children, onVisible }: StorySectionProps) {
  const ref = useRef<HTMLElement>(null);
  const visible = useInView(ref, { amount: .55 });
  const reduced = useReducedMotion();
  const { text } = useUIPreferences();
  const { address } = useAccount();
  useEffect(() => { if (visible) onVisible(index); }, [index, onVisible, visible]);
  return <section ref={ref} id={`story-${index}`} className={`story-panel story-panel-${index}`}>
    <div className="story-noise" />
    <div className="shell story-grid">
      <motion.div initial={reduced ? false : { opacity: 0, y: 34 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: .2, y: 28 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }} className="relative z-10">
        <div className="story-kicker"><span>0{index}</span><span className="h-px w-10 bg-current opacity-40" />{text(eyebrow)}</div>
        <h1 className="story-title">{title}</h1>
        <p className="story-body">{body}</p>
        {index === 1 && <a href="#story-2" className="story-scroll-cue"><ArrowDown size={16} /> {text({ en: "Scroll to the problem", tr: "Soruna ilerle" })}</a>}
        {index === 3 && <div className="mt-9 flex flex-wrap gap-3"><Link href="/events" className="btn-primary">{text({ en: "Enter the protocol", tr: "Protokole Gir" })}<ArrowRight size={16} /></Link>{address && <Link href="/create" className="btn-secondary">{text({ en: "Create an event", tr: "Etkinlik Oluştur" })}</Link>}</div>}
      </motion.div>
      <motion.div initial={reduced ? false : { opacity: 0, scale: .94 }} animate={visible ? { opacity: 1, scale: 1 } : { opacity: .12, scale: .96 }} transition={{ duration: .7, delay: .08, ease: [0.22, 1, 0.36, 1] }} className="relative z-10">{children}</motion.div>
    </div>
  </section>;
}

function MottoVisual() {
  const { text } = useUIPreferences();
  return <div className="gate-visual" aria-hidden="true">
    <div className="gate-orbit gate-orbit-one" /><div className="gate-orbit gate-orbit-two" /><div className="gate-orbit gate-orbit-three" />
    <motion.div className="gate-core" animate={{ boxShadow: ["0 0 35px rgba(238,181,27,.12)", "0 0 75px rgba(238,181,27,.28)", "0 0 35px rgba(238,181,27,.12)"] }} transition={{ duration: 3.5, repeat: Infinity }}><Fingerprint size={58} /><span>P2P</span></motion.div>
    <div className="gate-proof proof-top"><span className="status-dot text-green-400" /> {text({ en: "TICKET OWNED", tr: "BİLET SENİN" })}</div>
    <div className="gate-proof proof-bottom"><ShieldCheck size={14} /> {text({ en: "ESCROW SECURED", tr: "ESCROW GÜVENDE" })}</div>
    <div className="gate-blocks"><span /><span /><span /><span /><span /></div>
  </div>;
}

function ProblemVisual() {
  const { text } = useUIPreferences();
  return <div className="problem-visual">
    <div className="problem-axis" />
    <div className="problem-node problem-node-a"><UserRoundX /><div><small>ADMISSION</small><strong>{text({ en: "Platform-controlled access", tr: "Platform kontrollü erişim" })}</strong></div></div>
    <div className="problem-node problem-node-b"><Coins /><div><small>PAYMENT</small><strong>{text({ en: "Funds behind a middleman", tr: "Ödeme aracıya bağlı" })}</strong></div></div>
    <div className="problem-node problem-node-c"><ShieldCheck /><div><small>EVENT HISTORY</small><strong>{text({ en: "History disappears", tr: "Geçmiş kayboluyor" })}</strong></div></div>
    <div className="problem-stamp">MIDDLEMAN<br />REQUIRED</div>
  </div>;
}

function SolutionVisual() {
  const { text } = useUIPreferences();
  const steps = [
    { icon: TicketCheck, no: "01", en: "Publish direct", tr: "Doğrudan yayınla", detailEn: "Organizer to attendee", detailTr: "Organizatörden katılımcıya" },
    { icon: Coins, no: "02", en: "Pass & payment on-chain", tr: "Pass ve ödeme on-chain", detailEn: "Wallet-owned · escrowed", detailTr: "Cüzdanda · escrow güvenceli" },
    { icon: ScanLine, no: "03", en: "Check-in unlocks social proof", tr: "Check-in sosyal kanıtı açar", detailEn: "Verified ratings & reviews", detailTr: "Doğrulanmış puan ve yorum" },
  ];
  return <div className="solution-path">
    <div className="solution-line" />
    {steps.map((step, index) => { const Icon = step.icon; return <motion.div key={step.no} className="solution-step" initial={{ opacity: 0, x: 22 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: .7 }} transition={{ delay: index * .12 }}><span className="solution-index">{step.no}</span><span className="solution-icon"><Icon size={21} /></span><div><strong>{text({ en: step.en, tr: step.tr })}</strong><small><Check size={12} /> {text({ en: step.detailEn, tr: step.detailTr })}</small></div></motion.div>; })}
    <div className="solution-result"><span className="status-dot text-green-400" /><span>{text({ en: "NO MIDDLEMAN · SHARED TRUST", tr: "ARACISIZ · ORTAK GÜVEN" })}</span></div>
  </div>;
}

export function HomeStory() {
  const [active, setActive] = useState(1);
  const { language, text } = useUIPreferences();
  const jump = (index: number) => document.getElementById(`story-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <div className="home-story" key={language}>
    <div className="story-pagination" aria-label={text({ en: "Homepage chapters", tr: "Ana sayfa bölümleri" })}>{[1,2,3].map(index => <button key={index} onClick={() => jump(index)} className={active === index ? "is-active" : ""} aria-label={`${index}`}><span>0{index}</span><i /></button>)}</div>
    <StorySection index={1} eyebrow={{ en: "TICKET · WALLET · OWNERSHIP", tr: "BİLET · CÜZDAN · SAHİPLİK" }} onVisible={setActive} title={<>{text({ en: "The ticket.", tr: "Biletin." })}<br /><span>{text({ en: "Without the", tr: "Aracı" })}</span><br />{text({ en: "middleman.", tr: "olmadan." })}</>} body={text({ en: "P2Pass brings event publishing, ticket ownership and payment directly on-chain. Organizers meet attendees without a platform owning the gate between them.", tr: "P2Pass etkinlik yayınlama, bilet sahipliği ve ödemeyi doğrudan on-chain hale getirir. Organizatör ile katılımcı arasındaki kapının sahibi artık bir platform değildir." })}><MottoVisual /></StorySection>
    <StorySection index={2} eyebrow={{ en: "THE PROBLEM", tr: "SORUN" }} onVisible={setActive} title={<>{text({ en: "Ticketing still", tr: "Biletleme hâlâ" })}<br />{text({ en: "has a", tr: "bir aracıya" })}<br /><span>{text({ en: "gatekeeper.", tr: "bağlı." })}</span></>} body={text({ en: "Traditional platforms control who can publish, who can enter and when organizers receive their funds. Tickets and event history vanish when the platform relationship ends.", tr: "Geleneksel platformlar kimin yayınlayacağını, kimin gireceğini ve organizatörün ödemesini ne zaman alacağını kontrol eder. Platform ilişkisi bittiğinde bilet ve etkinlik geçmişi de kaybolur." })}><ProblemVisual /></StorySection>
    <StorySection index={3} eyebrow={{ en: "THE P2PASS SOLUTION", tr: "P2PASS ÇÖZÜMÜ" }} onVisible={setActive} title={<>{text({ en: "Ticketing belongs", tr: "Biletleme" })}<br /><span>{text({ en: "on-chain.", tr: "on-chain olmalı." })}</span></>} body={text({ en: "Organizers publish directly. Attendees own a soulbound pass while native ETH stays protected in escrow. Authorized check-in proves attendance — then verified ratings and peer reviews add a social layer on top.", tr: "Organizatör doğrudan yayınlar. Katılımcı soulbound pass'ine sahip olurken native ETH escrow'da korunur. Yetkili check-in katılımı kanıtlar; doğrulanmış puan ve yorumlar bunun üzerine sosyal bir katman ekler." })}><SolutionVisual /></StorySection>
  </div>;
}
