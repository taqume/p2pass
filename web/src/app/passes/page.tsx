import type { Metadata } from "next";
import { PassGallery } from "@/components/pass-gallery";

export const metadata: Metadata = { title: "My passes" };

export default function PassesPage() {
  return <div className="shell py-16"><div className="mb-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-9 sm:flex-row sm:items-end"><div><div className="eyebrow">WALLET INVENTORY</div><h1 className="page-title mt-4">My passes</h1></div><p className="max-w-sm text-sm leading-6 text-slate-500">These passes are bound to your wallet. They cannot be transferred or sold.</p></div><PassGallery /></div>;
}

