import type { Metadata } from "next";
import { PassGallery } from "@/components/pass-gallery";
import { Localized } from "@/components/ui-preferences";

export const metadata: Metadata = { title: "My passes" };

export default function PassesPage() {
  return <div className="shell py-16"><div className="mb-10 flex flex-col justify-between gap-4 border-b border-white/10 pb-9 sm:flex-row sm:items-end"><div><div className="eyebrow"><Localized en="WALLET INVENTORY" tr="CÜZDAN ENVANTERİ" /></div><h1 className="page-title mt-4"><Localized en="My passes" tr="Biletlerim" /></h1></div><p className="max-w-sm text-sm leading-6 text-slate-500"><Localized en="These passes are bound to your wallet. They cannot be transferred or sold." tr="Bu pass'ler cüzdanına bağlıdır; transfer edilemez veya satılamaz." /></p></div><PassGallery /></div>;
}
