import type { Metadata } from "next";
import { OrganizerConsole } from "@/components/organizer-console";
import { Localized } from "@/components/ui-preferences";

export const metadata: Metadata = { title: "Organizer" };
export default function OrganizePage() { return <div className="shell py-14"><div className="mb-10"><div className="eyebrow"><Localized en="ORGANIZER WORKSPACE" tr="ORGANİZATÖR ALANI" /></div><h1 className="page-title mt-4"><Localized en="Run the room." tr="Etkinliği yönet." /></h1><p className="mt-4 max-w-xl leading-7 text-slate-400"><Localized en="Manage access, attendance and settlement without leaving the protocol." tr="Erişimi, katılımı ve ödemeleri protokolden ayrılmadan yönet." /></p></div><OrganizerConsole /></div>; }
