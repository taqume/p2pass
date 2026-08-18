import { isAddress } from "viem";
import { notFound } from "next/navigation";
import { ProfileClient } from "@/components/profile-client";

export default async function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  if (!isAddress(address)) notFound();
  return <ProfileClient profileAddress={address} />;
}

