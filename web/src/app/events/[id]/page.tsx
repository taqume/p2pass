import { EventRouteClient } from "@/components/event-route-client";
import { demoEvents } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();
  const event = demoEvents.find(item => item.id === numericId);
  return <EventRouteClient id={numericId} preview={event} />;
}
