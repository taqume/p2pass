"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Fingerprint, Link2, ScanLine, ShieldCheck, TicketCheck, UserRoundX } from "lucide-react";
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
    <div className="gate-proof proof-top"><span className="status-dot text-green-400" /> {text({ en: "WALLET VERIFIED", tr: "CÜZDAN DOĞRULANDI" })}</div>
    <div className="gate-proof proof-bottom"><ShieldCheck size={14} /> {text({ en: "ON-CHAIN PROOF", tr: "ON-CHAIN KANIT" })}</div>
    <div className="gate-blocks"><span /><span /><span /><span /><span /></div>
  </div>;
}

function ProblemVisual() {
  const { text } = useUIPreferences();
  return <div className="problem-visual">
    <div className="problem-axis" />
    <div className="problem-node problem-node-a"><UserRoundX /><div><small>0x72A4…9F31</small><strong>{text({ en: "No shared context", tr: "Ortak bağlam yok" })}</strong></div></div>
    <div className="problem-node problem-node-b"><Link2 /><div><small>EVENT HISTORY</small><strong>{text({ en: "Locked in platforms", tr: "Platformlara kilitli" })}</strong></div></div>
    <div className="problem-node problem-node-c"><ShieldCheck /><div><small>REPUTATION</small><strong>{text({ en: "Easy to fake", tr: "Taklit edilmesi kolay" })}</strong></div></div>
    <div className="problem-stamp">CONTEXT<br />MISSING</div>
  </div>;
}

function SolutionVisual() {
  const { text } = useUIPreferences();
  const steps = [
    { icon: TicketCheck, no: "01", en: "Pass proves access", tr: "Pass erişimi kanıtlar", detailEn: "Non-transferable", detailTr: "Transfer edilemez" },
    { icon: ScanLine, no: "02", en: "Check-in proves presence", tr: "Check-in katılımı kanıtlar", detailEn: "Organizer verified", detailTr: "Organizatör doğrulamalı" },
    { icon: ShieldCheck, no: "03", en: "Presence unlocks trust", tr: "Katılım güveni açar", detailEn: "Shared attendance", detailTr: "Ortak katılım" },
  ];
  return <div className="solution-path">
    <div className="solution-line" />
    {steps.map((step, index) => { const Icon = step.icon; return <motion.div key={step.no} className="solution-step" initial={{ opacity: 0, x: 22 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: false, amount: .7 }} transition={{ delay: index * .12 }}><span className="solution-index">{step.no}</span><span className="solution-icon"><Icon size={21} /></span><div><strong>{text({ en: step.en, tr: step.tr })}</strong><small><Check size={12} /> {text({ en: step.detailEn, tr: step.detailTr })}</small></div></motion.div>; })}
    <div className="solution-result"><span className="status-dot text-green-400" /><span>SHARED PROOF ESTABLISHED</span></div>
  </div>;
}

export function HomeStory() {
  const [active, setActive] = useState(1);
  const { language, text } = useUIPreferences();
  const jump = (index: number) => document.getElementById(`story-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  return <div className="home-story" key={language}>
    <div className="story-pagination" aria-label={text({ en: "Homepage chapters", tr: "Ana sayfa bölümleri" })}>{[1,2,3].map(index => <button key={index} onClick={() => jump(index)} className={active === index ? "is-active" : ""} aria-label={`${index}`}><span>0{index}</span><i /></button>)}</div>
    <StorySection index={1} eyebrow={{ en: "PEER · PROOF · PASS", tr: "EŞLER · KANIT · GEÇİŞ" }} onVisible={setActive} title={<>{text({ en: "Show up.", tr: "Orada ol." })}<br /><span>{text({ en: "Prove it.", tr: "Kanıtla." })}</span><br />{text({ en: "Build trust.", tr: "Güven oluştur." })}</>} body={text({ en: "P2Pass turns real encounters into portable, on-chain relationships — owned by your wallet, not a platform.", tr: "P2Pass gerçek karşılaşmaları, bir platformun değil cüzdanının sahip olduğu taşınabilir on-chain ilişkilere dönüştürür." })}><MottoVisual /></StorySection>
    <StorySection index={2} eyebrow={{ en: "THE PROBLEM", tr: "SORUN" }} onVisible={setActive} title={<>{text({ en: "Online trust", tr: "Dijital güven" })}<br />{text({ en: "forgot the", tr: "aynı odada" })}<br /><span>{text({ en: "room.", tr: "olmayı unuttu." })}</span></>} body={text({ en: "Profiles can be bought. Ratings can be farmed. Event history disappears inside closed platforms. There is no durable proof that two people actually shared the same moment.", tr: "Profiller satın alınabilir. Puanlar manipüle edilebilir. Etkinlik geçmişi kapalı platformlarda kaybolur. İki insanın gerçekten aynı anı paylaştığını gösteren kalıcı bir kanıt yoktur." })}><ProblemVisual /></StorySection>
    <StorySection index={3} eyebrow={{ en: "THE P2PASS SOLUTION", tr: "P2PASS ÇÖZÜMÜ" }} onVisible={setActive} title={<>{text({ en: "The event becomes", tr: "Etkinlik ortak" })}<br /><span>{text({ en: "shared proof.", tr: "kanıta dönüşür." })}</span></>} body={text({ en: "A soulbound pass proves access. Authorized check-in proves attendance. Only shared attendance unlocks peer reputation. One simple chain of truth, entirely on Base.", tr: "Soulbound pass erişimi, yetkili check-in katılımı kanıtlar. Yalnızca ortak katılım kişiler arası itibarı açar. Tamamı Base üzerinde, tek ve yalın bir doğruluk zinciri." })}><SolutionVisual /></StorySection>
  </div>;
}
