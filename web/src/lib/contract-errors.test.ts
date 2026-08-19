import { describe, expect, it } from "vitest";
import { toFunctionSelector } from "viem";
import { readableContractError } from "./contract-errors";

describe("readableContractError", () => {
  it("translates decoded contract custom errors", () => {
    expect(readableContractError({ cause: { errorName: "AttendanceRequired" } }, "tr"))
      .toContain("iki cüzdan");
  });

  it("recognizes an undecoded custom error selector", () => {
    const data = toFunctionSelector("AlreadyRegistered()");
    expect(readableContractError({ details: `execution reverted: ${data}` }, "en"))
      .toContain("already owns");
  });

  it("explains wallet rejection without exposing provider noise", () => {
    expect(readableContractError(new Error("User rejected the request. Request Arguments: ..."), "tr"))
      .toBe("İşlem cüzdanda reddedildi.");
  });

  it("provides a stable fallback for unknown provider errors", () => {
    expect(readableContractError(new Error("something internal"), "en"))
      .toContain("could not be completed");
  });
});
