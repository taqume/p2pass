import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-white/8">
      <div className="shell flex flex-col gap-6 py-9 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p><span className="font-semibold text-slate-300">P2Pass</span> · Shared attendance unlocks reputation.</p>
        <div className="flex gap-5"><Link href="/events">Explore</Link><a href="https://sepolia.basescan.org" target="_blank" rel="noreferrer">BaseScan ↗</a></div>
      </div>
    </footer>
  );
}

