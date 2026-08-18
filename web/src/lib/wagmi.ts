import { createConfig, fallback, http } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors/injected";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected({ shimDisconnect: true })],
  transports: {
    [baseSepolia.id]: fallback([
      http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org"),
      http("https://base-sepolia-rpc.publicnode.com"),
    ]),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
