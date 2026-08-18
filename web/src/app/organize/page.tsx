import type { Metadata } from "next";
import { OrganizerConsole } from "@/components/organizer-console";

export const metadata: Metadata = { title: "Organizer" };
export default function OrganizePage() { return <div className="shell py-14"><div className="mb-10"><div className="eyebrow">ORGANIZER WORKSPACE</div><h1 className="page-title mt-4">Run the room.</h1><p className="mt-4 max-w-xl leading-7 text-slate-400">Manage access, attendance and settlement without leaving the protocol.</p></div><OrganizerConsole /></div>; }

