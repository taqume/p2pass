import type { Metadata } from "next";
import { CheckInScanner } from "@/components/check-in-scanner";
import { Localized } from "@/components/ui-preferences";

export const metadata: Metadata = { title: "QR check-in" };
export default async function ScanPage({ searchParams }: { searchParams: Promise<{ event?: string }> }) { const params = await searchParams; return <div className="shell py-12"><div className="mx-auto mb-8 max-w-lg text-center"><div className="eyebrow"><Localized en="MOBILE CHECK-IN" tr="MOBİL CHECK-IN" /></div><h1 className="page-title mt-4 !text-[clamp(2.5rem,7vw,4.5rem)]"><Localized en="Verify presence." tr="Katılımı doğrula." /></h1><p className="mt-4 text-sm leading-6 text-slate-500"><Localized en="Scan a participant’s P2Pass and confirm attendance with your authorized wallet." tr="Katılımcının P2Pass kodunu tara ve yetkili cüzdanınla katılımı doğrula." /></p></div><CheckInScanner initialEventId={Number(params.event) || 0} /></div>; }
