import type { Address } from "viem";

const zero = "0x0000000000000000000000000000000000000000" as Address;

export const contracts = {
  core: (process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS || zero) as Address,
  pass: (process.env.NEXT_PUBLIC_PASS_CONTRACT_ADDRESS || zero) as Address,
  reputation: (process.env.NEXT_PUBLIC_REPUTATION_CONTRACT_ADDRESS || zero) as Address,
};

export const contractsReady = contracts.core !== zero && contracts.reputation !== zero;

export const coreAbi = [
  { type: "function", name: "eventCount", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "creationFee", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "hasPass", stateMutability: "view", inputs: [{ name: "eventId", type: "uint256" }, { name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "attended", stateMutability: "view", inputs: [{ name: "eventId", type: "uint256" }, { name: "account", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "authorizedScanners", stateMutability: "view", inputs: [{ name: "eventId", type: "uint256" }, { name: "scanner", type: "address" }], outputs: [{ type: "bool" }] },
  { type: "function", name: "getCreatedEvents", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { type: "function", name: "getJoinedEvents", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256[]" }] },
  { type: "function", name: "getParticipants", stateMutability: "view", inputs: [{ name: "eventId", type: "uint256" }], outputs: [{ type: "address[]" }] },
  { type: "function", name: "getEvent", stateMutability: "view", inputs: [{ name: "eventId", type: "uint256" }], outputs: [{ type: "tuple", components: [
    { name: "organizer", type: "address" }, { name: "name", type: "string" }, { name: "description", type: "string" }, { name: "location", type: "string" }, { name: "imageURI", type: "string" }, { name: "startTime", type: "uint64" }, { name: "endTime", type: "uint64" }, { name: "capacity", type: "uint32" }, { name: "registered", type: "uint32" }, { name: "price", type: "uint96" }, { name: "escrowed", type: "uint256" }, { name: "cancelled", type: "bool" }, { name: "settled", type: "bool" }
  ] }] },
  { type: "function", name: "createEvent", stateMutability: "payable", inputs: [{ name: "input", type: "tuple", components: [
    { name: "name", type: "string" }, { name: "description", type: "string" }, { name: "location", type: "string" }, { name: "imageURI", type: "string" }, { name: "startTime", type: "uint64" }, { name: "endTime", type: "uint64" }, { name: "capacity", type: "uint32" }, { name: "price", type: "uint96" }
  ] }], outputs: [{ name: "eventId", type: "uint256" }] },
  { type: "function", name: "updateEvent", stateMutability: "nonpayable", inputs: [{ name: "eventId", type: "uint256" }, { name: "input", type: "tuple", components: [
    { name: "name", type: "string" }, { name: "description", type: "string" }, { name: "location", type: "string" }, { name: "imageURI", type: "string" }, { name: "startTime", type: "uint64" }, { name: "endTime", type: "uint64" }, { name: "capacity", type: "uint32" }, { name: "price", type: "uint96" }
  ] }], outputs: [] },
  { type: "function", name: "joinEvent", stateMutability: "payable", inputs: [{ name: "eventId", type: "uint256" }], outputs: [] },
  { type: "function", name: "checkIn", stateMutability: "nonpayable", inputs: [{ name: "eventId", type: "uint256" }, { name: "participant", type: "address" }], outputs: [] },
  { type: "function", name: "setScanner", stateMutability: "nonpayable", inputs: [{ name: "eventId", type: "uint256" }, { name: "scanner", type: "address" }, { name: "authorized", type: "bool" }], outputs: [] },
  { type: "function", name: "cancelEvent", stateMutability: "nonpayable", inputs: [{ name: "eventId", type: "uint256" }], outputs: [] },
  { type: "function", name: "claimRefund", stateMutability: "nonpayable", inputs: [{ name: "eventId", type: "uint256" }], outputs: [] },
  { type: "function", name: "withdrawProceeds", stateMutability: "nonpayable", inputs: [{ name: "eventId", type: "uint256" }], outputs: [] },
] as const;

export const reputationAbi = [
  { type: "function", name: "updateProfile", stateMutability: "nonpayable", inputs: [{ name: "username", type: "string" }, { name: "displayName", type: "string" }, { name: "bio", type: "string" }, { name: "avatarURI", type: "string" }, { name: "link", type: "string" }], outputs: [] },
  { type: "function", name: "getProfile", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "tuple", components: [{ name: "username", type: "string" }, { name: "displayName", type: "string" }, { name: "bio", type: "string" }, { name: "avatarURI", type: "string" }, { name: "link", type: "string" }, { name: "updatedAt", type: "uint64" }] }] },
  { type: "function", name: "peerAverage", stateMutability: "view", inputs: [{ name: "target", type: "address" }], outputs: [{ name: "averageX100", type: "uint256" }] },
  { type: "function", name: "eventAverage", stateMutability: "view", inputs: [{ name: "eventId", type: "uint256" }], outputs: [{ name: "averageX100", type: "uint256" }] },
  { type: "function", name: "reviewEvent", stateMutability: "nonpayable", inputs: [{ name: "eventId", type: "uint256" }, { name: "rating", type: "uint8" }, { name: "comment", type: "string" }], outputs: [] },
  { type: "function", name: "reviewPeer", stateMutability: "nonpayable", inputs: [{ name: "target", type: "address" }, { name: "proofEventId", type: "uint256" }, { name: "rating", type: "uint8" }, { name: "comment", type: "string" }], outputs: [] },
] as const;
