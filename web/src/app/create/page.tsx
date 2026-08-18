import type { Metadata } from "next";
import { CreateEventForm } from "@/components/create-event-form";

export const metadata: Metadata = { title: "Create an event" };

export default function CreatePage() {
  return <div className="shell py-16"><div className="mb-12 max-w-3xl"><div className="eyebrow">ORGANIZER PROTOCOL</div><h1 className="page-title mt-4">Create a reason<br />to show up.</h1><p className="mt-5 max-w-xl leading-7 text-slate-400">Publish a public event, define admission, and mint a unique non-transferable pass for every participant.</p></div><CreateEventForm /></div>;
}

