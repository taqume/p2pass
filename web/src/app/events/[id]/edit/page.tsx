import { notFound } from "next/navigation";
import { EditEventForm } from "@/components/edit-event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const eventId = Number(id);
  if (!Number.isInteger(eventId) || eventId < 1) notFound();
  return <EditEventForm eventId={eventId} />;
}

