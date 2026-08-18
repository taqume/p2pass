import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(address?: string, size = 4) {
  if (!address) return "Not connected";
  return `${address.slice(0, size + 2)}…${address.slice(-size)}`;
}

export function formatEth(value: bigint | number) {
  const amount = typeof value === "bigint" ? Number(value) / 1e18 : value;
  if (amount === 0) return "FREE";
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 4 })} ETH`;
}

export function ipfsToHttp(uri: string) {
  return uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri;
}

