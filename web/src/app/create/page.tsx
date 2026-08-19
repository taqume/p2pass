import type { Metadata } from "next";
import { CreateEventForm } from "@/components/create-event-form";
import { Localized } from "@/components/ui-preferences";
import { AmbientPage } from "@/components/ambient-page";

export const metadata: Metadata = { title: "Create an event" };

export default function CreatePage() {
  return <AmbientPage variant="workspace"><div className="shell py-16"><div className="mb-12 max-w-3xl"><div className="eyebrow"><Localized en="ORGANIZER PROTOCOL" tr="ORGANİZATÖR PROTOKOLÜ" /></div><h1 className="page-title mt-4"><Localized en="Create a reason to show up." tr="Bir araya gelmek için sebep yarat." /></h1><p className="mt-5 max-w-xl leading-7 text-slate-400"><Localized en="Publish a public event, define admission, and mint a unique non-transferable pass for every participant." tr="Herkese açık bir etkinlik yayınla, katılım koşullarını belirle ve her katılımcı için transfer edilemez benzersiz bir pass oluştur." /></p></div><CreateEventForm /></div></AmbientPage>;
}
