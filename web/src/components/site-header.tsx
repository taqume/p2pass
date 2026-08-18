"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronDown, DoorOpen, House, Languages, LogOut, Menu, Moon, Plus, Sun, TicketCheck, UserRound, Wallet, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { contracts, contractsReady, reputationAbi } from "@/lib/contracts";
import { shortAddress } from "@/lib/utils";
import { useUIPreferences } from "./ui-preferences";

const navItems = [
  { en: "Home", tr: "Ana Sayfa", href: "/", icon: House },
  { en: "Events", tr: "Etkinlikler", href: "/events", icon: CalendarDays },
  { en: "My Passes", tr: "Biletlerim", href: "/passes", icon: TicketCheck },
  { en: "My Events", tr: "Etkinliklerim", href: "/organize", icon: DoorOpen },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function WalletControl() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { text } = useUIPreferences();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRead = useReadContract({ address: contracts.reputation, abi: reputationAbi, functionName: "getProfile", args: address ? [address] : undefined, query: { enabled: Boolean(address && contractsReady) } });
  const username = profileRead.data?.username;

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (isConnected && chainId !== baseSepolia.id) {
    return <button className="btn-primary whitespace-nowrap" onClick={() => switchChain({ chainId: baseSepolia.id })}>{text({ en: "Switch to Base", tr: "Base'e Geç" })}</button>;
  }
  if (!isConnected) {
    return <button className="btn-primary whitespace-nowrap" disabled={isPending} onClick={() => connectors[0] && connect({ connector: connectors[0] })}><Wallet size={16} /> {isPending ? text({ en: "Check wallet", tr: "Cüzdanı kontrol et" }) : text({ en: "Connect Wallet", tr: "Cüzdanı Bağla" })}</button>;
  }
  return (
    <div ref={menuRef} className="relative">
      <button className="wallet-trigger" onClick={() => setOpen(current => !current)} aria-expanded={open} aria-haspopup="menu">
        <span className="status-dot text-[#22c55e]" />
        <span className="hidden text-left lg:block">
          {username && <span className="block text-[10px] font-semibold leading-none text-[var(--brand)]">{text({ en: `Hi, ${username}`, tr: `Merhaba, ${username}` })}</span>}
          <span className="mono block text-xs leading-4">{shortAddress(address)}</span>
        </span>
        <span className="mono text-xs lg:hidden">{shortAddress(address)}</span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && <motion.div role="menu" initial={{ opacity: 0, y: -8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: .98 }} transition={{ duration: .16 }} className="wallet-menu">
          <div className="border-b border-[var(--line)] px-4 py-3"><div className="text-xs font-semibold">{username || text({ en: "Connected wallet", tr: "Bağlı cüzdan" })}</div><div className="mono mt-1 break-all text-[10px] text-[var(--muted)]">{address}</div></div>
          <Link role="menuitem" href={`/profile/${address}`} onClick={() => setOpen(false)} className="wallet-menu-item"><UserRound size={16} /> {text({ en: "Profile", tr: "Profil" })}</Link>
          <button role="menuitem" onClick={() => { disconnect(); setOpen(false); }} className="wallet-menu-item w-full text-red-400"><LogOut size={16} /> {text({ en: "Disconnect", tr: "Çıkış Yap" })}</button>
        </motion.div>}
      </AnimatePresence>
    </div>
  );
}

function PreferenceControls({ mobile = false }: { mobile?: boolean }) {
  const { language, setLanguage, theme, toggleTheme, text } = useUIPreferences();
  return <div className={`flex items-center ${mobile ? "justify-between border-y border-[var(--line)] py-3" : "gap-1"}`}>
    <button onClick={toggleTheme} className="header-tool" aria-label={text({ en: "Toggle color theme", tr: "Renk temasını değiştir" })}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
    <button onClick={() => setLanguage(language === "en" ? "tr" : "en")} className="header-tool !w-auto gap-1.5 !px-2.5" aria-label={text({ en: "Change language", tr: "Dili değiştir" })}><Languages size={16} /><span className="text-[10px] font-bold tracking-wider">{language === "en" ? "TR" : "EN"}</span></button>
  </div>;
}

export function SiteHeader() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { text } = useUIPreferences();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <header className="site-header">
      <div className="header-shell">
        <Link href="/" className="brand-wordmark" aria-label="P2Pass home"><Image src="/p2pass-wordmark.png" width={2172} height={724} alt="P2Pass" className="h-auto w-full object-contain" priority /></Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
          {navItems.map(item => { const active = isActivePath(pathname, item.href); const Icon = item.icon; return <Link key={item.href} href={item.href} className={`nav-link ${active ? "is-active" : ""}`} aria-current={active ? "page" : undefined}><Icon size={15} /><span>{text({ en: item.en, tr: item.tr })}</span></Link>; })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex"><PreferenceControls />{address && <Link href="/create" className="create-nav-button"><Plus size={15} /> <span className="hidden xl:inline">{text({ en: "Create Event", tr: "Etkinlik Oluştur" })}</span></Link>}</div>
          <WalletControl />
          <button onClick={() => setMobileOpen(current => !current)} className="header-tool sm:hidden" aria-label={text({ en: "Open menu", tr: "Menüyü aç" })}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mobile-nav sm:hidden"><div className="grid gap-1 px-4 py-4">
          {navItems.map(item => { const Icon = item.icon; const active = isActivePath(pathname, item.href); return <Link key={item.href} href={item.href} className={`nav-link !justify-start ${active ? "is-active" : ""}`}><Icon size={16} />{text({ en: item.en, tr: item.tr })}</Link>; })}
          {address && <Link href="/create" className="nav-link !justify-start"><Plus size={16} /> {text({ en: "Create Event", tr: "Etkinlik Oluştur" })}</Link>}
          <PreferenceControls mobile />
        </div></motion.nav>}
      </AnimatePresence>
    </header>
  );
}
