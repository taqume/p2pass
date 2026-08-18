import { EventRouteClient } from "@/components/event-route-client";
import { notFound } from "next/navigation";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();
  return <EventRouteClient id={numericId} />;
}
