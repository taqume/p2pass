"use client";

import { Check, CircleAlert, LoaderCircle, Radio, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Hash } from "viem";
import { useUIPreferences } from "./ui-preferences";

type Props = { hash?: Hash; isPending?: boolean; isConfirming?: boolean; isSuccess?: boolean; error?: Error | null };

export function TransactionStatus({ hash, isPending, isConfirming, isSuccess, error }: Props) {
  const { text } = useUIPreferences();
  const active = isPending || hash || error;
  if (!active) return null;
  const content = error
    ? { icon: <CircleAlert size={18} />, title: text({ en: "Transaction failed", tr: "İşlem başarısız" }), text: error.message.split("\n")[0], color: "text-red-400" }
    : isPending
      ? { icon: <Wallet size={18} />, title: text({ en: "Waiting for wallet", tr: "Cüzdan bekleniyor" }), text: text({ en: "Review and confirm the request in your wallet.", tr: "İsteği cüzdanında kontrol edip onayla." }), color: "text-amber-400" }
      : isSuccess
        ? { icon: <Check size={18} />, title: text({ en: "Confirmed on Base Sepolia", tr: "Base Sepolia'da onaylandı" }), text: text({ en: "Your on-chain state is now updated.", tr: "On-chain durumun güncellendi." }), color: "text-green-400" }
        : isConfirming
          ? { icon: <LoaderCircle size={18} className="animate-spin" />, title: text({ en: "Confirming on Base Sepolia", tr: "Base Sepolia'da onaylanıyor" }), text: text({ en: "Transaction submitted. Waiting for block confirmation.", tr: "İşlem gönderildi; blok onayı bekleniyor." }), color: "text-[var(--brand)]" }
          : { icon: <Radio size={18} />, title: text({ en: "Transaction submitted", tr: "İşlem gönderildi" }), text: text({ en: "Your transaction is now visible on the network.", tr: "İşlemin artık ağ üzerinde görüntülenebilir." }), color: "text-[var(--brand)]" };
  return (
    <AnimatePresence mode="wait">
      <motion.div key={content.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 border-l-2 border-current bg-white/[.025] p-4">
        <div className={`flex items-center gap-2 font-semibold ${content.color}`}>{content.icon}{content.title}</div>
        <p className="mt-1 break-words text-xs leading-5 text-slate-400">{content.text}</p>
        {hash && <a className="mono mt-2 block text-[10px] text-[var(--brand)] hover:underline" target="_blank" rel="noreferrer" href={`https://sepolia.basescan.org/tx/${hash}`}>{hash.slice(0, 18)}… · {text({ en: "View on BaseScan", tr: "BaseScan'de görüntüle" })} ↗</a>}
      </motion.div>
    </AnimatePresence>
  );
}
