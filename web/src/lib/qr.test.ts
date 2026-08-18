import { describe, expect, it } from "vitest";
import { buildCheckInPayload, parseCheckInPayload } from "./qr";

const participant = "0x00000000000000000000000000000000000000a1" as const;

describe("P2Pass check-in QR payload", () => {
  it("round-trips a Base Sepolia event and participant", () => {
    const encoded = buildCheckInPayload(12, participant);
    expect(encoded).toBe("p2pass:84532:12:0x00000000000000000000000000000000000000A1");
    expect(parseCheckInPayload(encoded)).toEqual({ chainId: 84532, eventId: 12, participant: "0x00000000000000000000000000000000000000A1" });
  });

  it.each([
    "p2pass:1:12:0x00000000000000000000000000000000000000A1",
    "p2pass:84532:0:0x00000000000000000000000000000000000000A1",
    "p2pass:84532:12:not-an-address",
    "https://example.com/ticket/12",
  ])("rejects an invalid or foreign payload: %s", payload => {
    expect(parseCheckInPayload(payload)).toBeNull();
  });
});
