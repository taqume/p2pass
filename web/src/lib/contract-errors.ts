import { toFunctionSelector } from "viem";

type Language = "en" | "tr";
type Copy = { en: string; tr: string };

const contractErrors: Record<string, Copy> = {
  EventNotFound: { en: "This event does not exist.", tr: "Bu etkinlik bulunamadı." },
  NotOrganizer: { en: "Only the event organizer can do this.", tr: "Bu işlemi yalnızca etkinlik organizatörü yapabilir." },
  NotScanner: { en: "This wallet is not authorized to scan this event.", tr: "Bu cüzdanın etkinlikte tarama yetkisi yok." },
  InvalidSchedule: { en: "Choose a future start time and an end time after it.", tr: "Gelecekte bir başlangıç ve ondan sonraki bir bitiş zamanı seç." },
  InvalidPayment: { en: "The ETH amount does not match the required fee or pass price.", tr: "Gönderilen ETH, gerekli ücret veya pass fiyatıyla eşleşmiyor." },
  EventStarted: { en: "This event has already started and can no longer be changed.", tr: "Etkinlik başladı; artık bu değişiklik yapılamaz." },
  EventNotActive: { en: "Check-in is only available while the event is active.", tr: "Check-in yalnızca etkinlik devam ederken yapılabilir." },
  EventNotEnded: { en: "Revenue can be withdrawn after the event ends.", tr: "Gelir yalnızca etkinlik bittikten sonra çekilebilir." },
  EventIsCancelled: { en: "This event has been cancelled.", tr: "Bu etkinlik iptal edilmiş." },
  EventIsNotCancelled: { en: "A refund is available only after cancellation.", tr: "İade yalnızca etkinlik iptal edildikten sonra alınabilir." },
  CapacityReached: { en: "This event is sold out.", tr: "Etkinlik kapasitesi dolmuş." },
  InvalidCapacity: { en: "Capacity cannot be lower than the number of registered attendees.", tr: "Kapasite, kayıtlı katılımcı sayısından düşük olamaz." },
  AlreadyRegistered: { en: "This wallet already owns the event pass.", tr: "Bu cüzdan etkinliğin pass'ine zaten sahip." },
  NotRegistered: { en: "This wallet does not own the event pass.", tr: "Bu cüzdan etkinliğin pass'ine sahip değil." },
  AlreadyAttended: { en: "This pass has already been checked in.", tr: "Bu pass ile daha önce check-in yapılmış." },
  AlreadySettled: { en: "This event's revenue has already been withdrawn.", tr: "Bu etkinliğin geliri daha önce çekilmiş." },
  NothingToClaim: { en: "There is no payment available to refund.", tr: "İade edilebilecek bir ödeme bulunmuyor." },
  TransferFailed: { en: "The ETH transfer failed. Try again or use another wallet.", tr: "ETH transferi başarısız oldu. Tekrar dene veya başka bir cüzdan kullan." },
  PriceLocked: { en: "The pass price is locked after the first registration.", tr: "İlk katılımdan sonra pass fiyatı değiştirilemez." },
  InvalidRating: { en: "Choose a rating between 1 and 5.", tr: "1 ile 5 arasında bir puan seç." },
  InvalidTarget: { en: "You cannot review your own wallet.", tr: "Kendi cüzdanına yorum yapamazsın." },
  AttendanceRequired: { en: "A verified check-in is required. For peer reviews, both wallets must have attended the same event.", tr: "Doğrulanmış check-in gerekli. Kişi yorumunda iki cüzdan da aynı etkinliğe katılmış olmalı." },
  TextTooLong: { en: "One or more profile or review fields exceed the on-chain character limit.", tr: "Profil veya yorum alanlarından biri on-chain karakter sınırını aşıyor." },
};

const selectors = new Map(Object.keys(contractErrors).map(name => [toFunctionSelector(`${name}()`), name]));

function collectErrorText(value: unknown, seen = new Set<unknown>()): string[] {
  if (!value || seen.has(value)) return [];
  if (typeof value === "string") return [value];
  if (typeof value !== "object") return [];
  seen.add(value);
  const record = value as Record<string, unknown>;
  return ["errorName", "name", "shortMessage", "details", "reason", "message", "data", "cause"]
    .flatMap(key => collectErrorText(record[key], seen));
}

export function readableContractError(error: unknown, language: Language): string {
  const text = collectErrorText(error).join("\n");
  const lower = text.toLowerCase();
  const contractName = Object.keys(contractErrors).find(name => text.includes(name))
    ?? [...selectors].find(([selector]) => lower.includes(selector.toLowerCase()))?.[1];
  if (contractName) return contractErrors[contractName][language];
  if (/user rejected|user denied|rejected the request|request rejected|4001/.test(lower)) {
    return language === "tr" ? "İşlem cüzdanda reddedildi." : "The transaction was rejected in the wallet.";
  }
  if (/insufficient funds|exceeds the balance/.test(lower)) {
    return language === "tr" ? "İşlem ve ağ ücreti için cüzdanda yeterli ETH yok." : "The wallet does not have enough ETH for the transaction and network fee.";
  }
  if (/chain.*mismatch|wrong network|unsupported chain/.test(lower)) {
    return language === "tr" ? "Cüzdanını Base Sepolia ağına geçirip tekrar dene." : "Switch the wallet to Base Sepolia and try again.";
  }
  if (/failed to fetch|network error|rpc|timeout|timed out/.test(lower)) {
    return language === "tr" ? "Base Sepolia bağlantısı şu anda yanıt vermiyor. Biraz sonra tekrar dene." : "The Base Sepolia connection is not responding. Try again shortly.";
  }
  if (/execution reverted|contractfunctionexecutionerror|contract function.*reverted/.test(lower)) {
    return language === "tr" ? "Kontrat işlemi kabul etmedi. Etkinlik durumunu, yetkini ve ödeme tutarını kontrol et." : "The contract rejected the transaction. Check the event state, your permission, and the payment amount.";
  }
  return language === "tr" ? "İşlem tamamlanamadı. Cüzdan ve Base Sepolia bağlantını kontrol edip tekrar dene." : "The transaction could not be completed. Check the wallet and Base Sepolia connection, then try again.";
}
