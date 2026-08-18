import type { Metadata } from "next";
import { CheckInScanner } from "@/components/check-in-scanner";

export const metadata: Metadata = { title: "QR check-in" };
export default async function ScanPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) { const params = await searchParams; return <div className="shell py-12"><div className="mx-auto mb-8 max-w-lg text-center"><div className="eyebrow">MOBILE CHECK-IN</div><h1 className="page-title mt-4 !text-[clamp(2.5rem,7vw,4.5rem)]">Verify presence.</h1><p className="mt-4 text-sm leading-6 text-slate-500">Scan a participant’s P2Pass and confirm attendance with your authorized wallet.</p></div><CheckInScanner initialEventId={Number(params.event) || 0} /></div>; }

