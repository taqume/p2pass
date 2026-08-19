"use client";

import Link from "next/link";
import { ArrowDown, ArrowRight, Check, Coins, Fingerprint, ScanLine, ShieldCheck, TicketCheck, UserRoundX } from "lucide-react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
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
    <motion.div className="story-entry-shade" initial={false} animate={{ opacity: visible ? 0 : .9, y: visible ? "-18%" : "0%" }} transition={{ duration: reduced ? 0 : 1.05, ease: [0.22, 1, 0.36, 1] }} />
    <div className="shell story-grid">
      <motion.div initial={reduced ? false : { opacity: 0, y: 34 }} animate={visible ? { opacity: 1, y: 0 } : { opacity: .16, y: 32 }} transition={{ duration: .92, ease: [0.22, 1, 0.36, 1] }} className="relative z-10">
        <div className="story-kicker"><span>0{index}</span><span className="h-px w-10 bg-current opacity-40" />{text(eyebrow)}</div>
        <h1 className="story-title">{title}</h1>
        <p className="story-body">{body}</p>
        {index === 1 && <a href="#story-2" className="story-scroll-cue"><ArrowDown size={16} /> {text({ en: "Scroll to the problem", tr: "Soruna ilerle" })}</a>}
        {index === 3 && <div className="mt-9 flex flex-wrap gap-3"><Link href="/events" className="btn-primary">{text({ en: "Enter the protocol", tr: "Protokole Gir" })}<ArrowRight size={16} /></Link>{address && <Link href="/create" className="btn-secondary">{text({ en: "Create an event", tr: "Etkinlik Oluştur" })}</Link>}</div>}
      </motion.div>
      <motion.div initial={reduced ? false : { opacity: 0, scale: .94 }} animate={visible ? { opacity: 1, scale: 1 } : { opacity: .08, scale: .955 }} transition={{ duration: 1, delay: .1, ease: [0.22, 1, 0.36, 1] }} className="story-interactive-visual relative z-10">{children}</motion.div>
    </div>
  </section>;
}

function RotatingOwnership() {
  const { language } = useUIPreferences();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const lines = language === "tr"
    ? ["Biletin senin.", "Ödemen senin.", "İtibarın senin."]
    : ["Your ticket.", "Your payment.", "Your reputation."];
  useEffect(() => {
    if (reduced) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % lines.length), 2300);
    return () => window.clearInterval(timer);
  }, [lines.length, reduced]);
  return <span className="ownership-rotator" aria-live="polite">
    <AnimatePresence mode="wait" initial={false}>
      <motion.span key={`${language}-${index}`} initial={reduced ? false : { opacity: 0, y: 22, filter: "blur(7px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={reduced ? undefined : { opacity: 0, y: -18, filter: "blur(6px)" }} transition={{ duration: .42, ease: [0.22, 1, 0.36, 1] }}>{lines[index]}</motion.span>
    </AnimatePresence>
  </span>;
}

function MottoVisual() {
  const { text } = useUIPreferences();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const follow = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !ref.current) return;
    const bounds = ref.current.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - bounds.top) / bounds.height, 0), 1);
    ref.current.style.setProperty("--gate-x", `${x * 100}%`);
    ref.current.style.setProperty("--gate-y", `${y * 100}%`);
    ref.current.style.setProperty("--gate-shift-x", `${(x - .5) * 26}px`);
    ref.current.style.setProperty("--gate-shift-y", `${(y - .5) * 26}px`);
    ref.current.style.setProperty("--gate-back-x", `${(x - .5) * -10}px`);
    ref.current.style.setProperty("--gate-back-y", `${(y - .5) * -10}px`);
    ref.current.style.setProperty("--gate-front-x", `${(x - .5) * 15}px`);
    ref.current.style.setProperty("--gate-front-y", `${(y - .5) * 15}px`);
  };
  const reset = () => {
    ref.current?.style.setProperty("--gate-x", "50%");
    ref.current?.style.setProperty("--gate-y", "50%");
    ref.current?.style.setProperty("--gate-shift-x", "0px");
    ref.current?.style.setProperty("--gate-shift-y", "0px");
    ref.current?.style.setProperty("--gate-back-x", "0px");
    ref.current?.style.setProperty("--gate-back-y", "0px");
    ref.current?.style.setProperty("--gate-front-x", "0px");
    ref.current?.style.setProperty("--gate-front-y", "0px");
  };
  return <div ref={ref} className="gate-visual" onPointerMove={follow} onPointerLeave={reset} aria-hidden="true">
    <div className="gate-follow-light" />
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
    <motion.div whileHover={{ x: 8, borderColor: "rgba(239,68,68,.45)" }} className="problem-node problem-node-a"><UserRoundX /><div><small>ADMISSION</small><strong>{text({ en: "Platform-controlled access", tr: "Platform kontrollü erişim" })}</strong></div></motion.div>
    <motion.div whileHover={{ x: -8, borderColor: "rgba(239,68,68,.45)" }} className="problem-node problem-node-b"><Coins /><div><small>PAYMENT</small><strong>{text({ en: "Funds behind a middleman", tr: "Ödeme aracıya bağlı" })}</strong></div></motion.div>
    <motion.div whileHover={{ x: 8, borderColor: "rgba(239,68,68,.45)" }} className="problem-node problem-node-c"><ShieldCheck /><div><small>EVENT HISTORY</small><strong>{text({ en: "History disappears", tr: "Geçmiş kayboluyor" })}</strong></div></motion.div>
    <div className="problem-stamp">MIDDLEMAN<br />REQUIRED</div>
  </div>;
}

function SolutionVisual() {
  const { text } = useUIPreferences();
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    { icon: TicketCheck, no: "01", en: "Publish direct", tr: "Doğrudan yayınla", detailEn: "Organizer to attendee", detailTr: "Organizatörden katılımcıya" },
    { icon: Coins, no: "02", en: "Pass & payment on-chain", tr: "Pass ve ödeme on-chain", detailEn: "Wallet-owned · escrowed", detailTr: "Cüzdanda · escrow güvenceli" },
    { icon: ScanLine, no: "03", en: "Check-in unlocks social proof", tr: "Check-in sosyal kanıtı açar", detailEn: "Verified ratings & reviews", detailTr: "Doğrulanmış puan ve yorum" },
  ];
  const results = [
    { en: "NO LISTING GATEKEEPER", tr: "YAYINLAMA ARACISI YOK" },
    { en: "WALLET-OWNED PASS · PROTECTED ETH", tr: "CÜZDANDA PASS · KORUNAN ETH" },
    { en: "VERIFIED ATTENDANCE · SHARED TRUST", tr: "DOĞRULANMIŞ KATILIM · ORTAK GÜVEN" },
  ];
  return <div className="solution-path">
    <div className="solution-line" />
    {steps.map((step, index) => { const Icon = step.icon; return <motion.button type="button" key={step.no} onMouseEnter={() => setActiveStep(index)} onFocus={() => setActiveStep(index)} onClick={() => setActiveStep(index)} className={`solution-step text-left ${activeStep === index ? "is-active" : ""}`} initial={{ opacity: 0, x: 22 }} whileInView={{ opacity: 1, x: 0 }} whileHover={{ x: 6 }} viewport={{ once: false, amount: .7 }} transition={{ delay: index * .12 }}><span className="solution-index">{step.no}</span><span className="solution-icon"><Icon size={21} /></span><div><strong>{text({ en: step.en, tr: step.tr })}</strong><small><Check size={12} /> {text({ en: step.detailEn, tr: step.detailTr })}</small></div></motion.button>; })}
    <motion.div key={activeStep} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="solution-result"><span className="status-dot text-green-400" /><span>{text(results[activeStep])}</span></motion.div>
  </div>;
}

export function HomeStory() {
  const [active, setActive] = useState(1);
  const { language, text } = useUIPreferences();
  const storyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const jump = (index: number) => document.getElementById(`story-${index}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const trackPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !storyRef.current) return;
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    storyRef.current.style.setProperty("--pointer-x", `${event.clientX}px`);
    storyRef.current.style.setProperty("--pointer-y", `${event.clientY}px`);
    storyRef.current.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
    storyRef.current.style.setProperty("--tilt-y", `${(x - 0.5) * 7}deg`);
  };
  const resetPointer = () => {
    storyRef.current?.style.setProperty("--tilt-x", "0deg");
    storyRef.current?.style.setProperty("--tilt-y", "0deg");
  };
  return <div ref={storyRef} className="home-story" key={language} onPointerMove={trackPointer} onPointerLeave={resetPointer}>
    <div className="story-progress" aria-hidden="true"><motion.i animate={{ width: `${active / 3 * 100}%` }} transition={{ duration: .4 }} /></div>
    <div className="story-pagination" aria-label={text({ en: "Homepage chapters", tr: "Ana sayfa bölümleri" })}>{[1,2,3].map(index => <button key={index} onClick={() => jump(index)} className={active === index ? "is-active" : ""} aria-label={`${index}`}><span>0{index}</span><i /></button>)}</div>
    {active < 3 ? <button className="story-command" onClick={() => jump(active + 1)}><span>{text({ en: "Next chapter", tr: "Sonraki bölüm" })}</span><kbd>0{active + 1}</kbd><ArrowDown size={14} /></button> : <Link href="/events" className="story-command"><span>{text({ en: "Explore events", tr: "Etkinlikleri keşfet" })}</span><kbd>↵</kbd><ArrowRight size={14} /></Link>}
    <StorySection index={1} eyebrow={{ en: "TICKET · WALLET · OWNERSHIP", tr: "BİLET · CÜZDAN · SAHİPLİK" }} onVisible={setActive} title={<>{text({ en: "No middleman.", tr: "Aracısız." })}<br /><RotatingOwnership /></>} body={text({ en: "P2Pass brings event publishing, ticket ownership and payment directly on-chain. Organizers meet attendees without a platform owning the gate between them.", tr: "P2Pass etkinlik yayınlama, bilet sahipliği ve ödemeyi doğrudan on-chain hale getirir. Organizatör ile katılımcı arasındaki kapının sahibi artık bir platform değildir." })}><MottoVisual /></StorySection>
    <StorySection index={2} eyebrow={{ en: "THE PROBLEM", tr: "SORUN" }} onVisible={setActive} title={<>{text({ en: "Ticketing still", tr: "Biletleme hâlâ" })}<br />{text({ en: "has a", tr: "bir aracıya" })}<br /><span>{text({ en: "gatekeeper.", tr: "bağlı." })}</span></>} body={text({ en: "Traditional platforms control who can publish, who can enter and when organizers receive their funds. Tickets and event history vanish when the platform relationship ends.", tr: "Geleneksel platformlar kimin yayınlayacağını, kimin gireceğini ve organizatörün ödemesini ne zaman alacağını kontrol eder. Platform ilişkisi bittiğinde bilet ve etkinlik geçmişi de kaybolur." })}><ProblemVisual /></StorySection>
    <StorySection index={3} eyebrow={{ en: "THE P2PASS SOLUTION", tr: "P2PASS ÇÖZÜMÜ" }} onVisible={setActive} title={<>{text({ en: "Ticketing belongs", tr: "Biletleme" })}<br /><span>{text({ en: "on-chain.", tr: "on-chain olmalı." })}</span></>} body={text({ en: "Organizers publish directly. Attendees own a soulbound pass while native ETH stays protected in escrow. Authorized check-in proves attendance — then verified ratings and peer reviews add a social layer on top.", tr: "Organizatör doğrudan yayınlar. Katılımcı soulbound pass'ine sahip olurken native ETH escrow'da korunur. Yetkili check-in katılımı kanıtlar; doğrulanmış puan ve yorumlar bunun üzerine sosyal bir katman ekler." })}><SolutionVisual /></StorySection>
  </div>;
}
