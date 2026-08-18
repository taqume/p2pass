import { getAddress, isAddress, type Address } from "viem";

export const BASE_SEPOLIA_CHAIN_ID = 84532;

export type CheckInPayload = {
  chainId: typeof BASE_SEPOLIA_CHAIN_ID;
  eventId: number;
  participant: Address;
};

export function buildCheckInPayload(eventId: number, participant: Address) {
  if (!Number.isSafeInteger(eventId) || eventId < 1 || !isAddress(participant)) {
    throw new Error("Invalid P2Pass check-in payload values");
  }
  return `p2pass:${BASE_SEPOLIA_CHAIN_ID}:${eventId}:${getAddress(participant)}`;
}

export function parseCheckInPayload(raw: string): CheckInPayload | null {
  const [scheme, chain, rawEventId, rawParticipant, ...rest] = raw.trim().split(":");
  const eventId = Number(rawEventId);
  if (rest.length || scheme !== "p2pass" || chain !== String(BASE_SEPOLIA_CHAIN_ID) || !Number.isSafeInteger(eventId) || eventId < 1 || !isAddress(rawParticipant)) return null;
  return { chainId: BASE_SEPOLIA_CHAIN_ID, eventId, participant: getAddress(rawParticipant) };
}
