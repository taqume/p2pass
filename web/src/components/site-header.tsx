"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Plus, Wallet, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { shortAddress } from "@/lib/utils";

const links = [
  ["Explore", "/events"],
  ["My passes", "/passes"],
  ["Organize", "/organize"],
] as const;

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  if (isConnected && chainId !== baseSepolia.id) {
    return <button className="btn-primary" onClick={() => switchChain({ chainId: baseSepolia.id })}>Switch to Base</button>;
  }
  if (isConnected) {
    return (
      <button className="btn-secondary mono" onClick={() => disconnect()} title="Disconnect wallet">
        <span className="status-dot text-[#22c55e]" /> {shortAddress(address)}
      </button>
    );
  }
  return (
    <button className="btn-primary" disabled={isPending} onClick={() => connectors[0] && connect({ connector: connectors[0] })}>
      <Wallet size={16} /> {compact ? "Connect" : isPending ? "Check wallet" : "Connect wallet"}
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { address } = useAccount();
  return (
    <header className="sticky top-0 z-50 border-b border-white/8 bg-[#0b1120]/88 backdrop-blur-xl">
      <div className="shell flex h-[72px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="P2Pass home">
          <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-lg border border-white/10 bg-[#111827]">
            <Image src="/p2pass-mark.png" width={34} height={34} alt="" className="h-8 w-8 object-contain" priority />
          </span>
          <span className="text-[1.05rem] font-bold tracking-[-.03em]">P2Pass</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={href} href={href} className="text-sm font-medium text-slate-400 transition-colors hover:text-white">{label}</Link>)}
          {address && <Link href={`/profile/${address}`} className="text-sm font-medium text-slate-400 transition-colors hover:text-white">Profile</Link>}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/create" className="btn-quiet"><Plus size={16} /> Create event</Link>
          <WalletButton />
        </div>
        <button onClick={() => setOpen(!open)} className="btn-quiet !px-2 md:hidden" aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/8 bg-[#0b1120] md:hidden">
            <div className="shell grid gap-1 py-4">
              {links.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href} className="py-3 text-slate-300">{label}</Link>)}
              <Link onClick={() => setOpen(false)} href="/create" className="py-3 text-slate-300">Create event</Link>
              <div className="pt-2"><WalletButton /></div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
