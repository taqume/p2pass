"use client";

import { Camera, Check, Keyboard, ScanLine, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAddress, type Address } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
import { parseCheckInPayload } from "@/lib/qr";
import type { ChainEvent } from "./onchain-event-list";
import { TransactionStatus } from "./transaction-status";
import { useUIPreferences } from "./ui-preferences";

export function CheckInScanner({ initialEventId }: { initialEventId: number }) {
  const { text } = useUIPreferences();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [payload, setPayload] = useState("");
  const [eventId, setEventId] = useState(String(initialEventId || ""));
  const [participant, setParticipant] = useState("");
  const [scanError, setScanError] = useState<string>();
  const { address: scannerAddress } = useAccount();
  const { data: hash, error, isPending, reset, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const numericEventId = Number(eventId);
  const valid = Number.isSafeInteger(numericEventId) && numericEventId > 0 && isAddress(participant);
  const eventRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getEvent", args: valid ? [BigInt(numericEventId)] : undefined, query: { enabled: contractsReady && valid } });
  const passRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "hasPass", args: valid ? [BigInt(numericEventId), participant as Address] : undefined, query: { enabled: contractsReady && valid } });
  const attendedRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "attended", args: valid ? [BigInt(numericEventId), participant as Address] : undefined, query: { enabled: contractsReady && valid } });
  const scannerRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "authorizedScanners", args: valid && scannerAddress ? [BigInt(numericEventId), scannerAddress] : undefined, query: { enabled: Boolean(contractsReady && valid && scannerAddress) } });
  const eventDetails = eventRead.data as ChainEvent | undefined;
  const now = Math.floor(Date.now() / 1000);
  const windowOpen = Boolean(eventDetails && now >= Number(eventDetails.startTime) && now <= Number(eventDetails.endTime));
  const scannerAuthorized = Boolean(eventDetails && scannerAddress && (eventDetails.organizer.toLowerCase() === scannerAddress.toLowerCase() || scannerRead.data === true));
  const checkingChain = valid && (eventRead.isLoading || passRead.isLoading || attendedRead.isLoading || Boolean(scannerAddress && scannerRead.isLoading));
  const alreadyAttended = attendedRead.data === true || receipt.isSuccess;
  const canCheckIn = Boolean(valid && eventDetails && !eventDetails.cancelled && windowOpen && passRead.data === true && !alreadyAttended && scannerAuthorized);

  const parse = useCallback((raw: string) => {
    reset();
    setPayload(raw);
    const parsed = parseCheckInPayload(raw);
    if (!parsed) { setScanError(text({ en: "This is not a valid Base Sepolia P2Pass QR payload.", tr: "Bu geçerli bir Base Sepolia P2Pass QR verisi değil." })); return; }
    setEventId(String(parsed.eventId)); setParticipant(parsed.participant); setScanError(undefined); setCameraOn(false);
  }, [reset, text]);

  useEffect(() => {
    if (!cameraOn || !videoRef.current) return;
    let scanner: { start: () => Promise<void>; destroy: () => void } | undefined;
    let cancelled = false;
    import("qr-scanner").then(({ default: QrScanner }) => {
      if (cancelled || !videoRef.current) return;
      scanner = new QrScanner(videoRef.current, result => parse(result.data), { returnDetailedScanResult: true, highlightScanRegion: true, highlightCodeOutline: true });
      scanner.start().catch(() => setScanError(text({ en: "Camera permission was denied or no camera is available.", tr: "Kamera izni reddedildi veya kullanılabilir kamera yok." })));
    });
    return () => { cancelled = true; scanner?.destroy(); };
  }, [cameraOn, parse, text]);

  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden border border-white/12 bg-[#111827]">
        <div className="flex items-center justify-between border-b border-white/10 p-4"><div><div className="eyebrow">{text({ en: "AUTHORIZED SCANNER", tr: "YETKİLİ TARAYICI" })}</div><div className="mt-1 text-sm font-semibold">Base Sepolia check-in</div></div><span className="status-dot text-green-400" /></div>
        <div className="relative aspect-square bg-[#070b14]">
          {cameraOn ? <video ref={videoRef} className="h-full w-full object-cover" muted playsInline /> : <div className="absolute inset-0 grid place-items-center text-center"><div><div className="relative mx-auto grid h-40 w-40 place-items-center border border-amber-400/35"><span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-amber-400" /><span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-amber-400" /><span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-amber-400" /><span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-amber-400" /><ScanLine size={42} className="text-amber-400" /></div><button onClick={() => setCameraOn(true)} className="btn-primary mt-6"><Camera size={16} /> {text({ en: "Start camera", tr: "Kamerayı başlat" })}</button></div></div>}
        </div>
        <div className="p-5">
          <div className="mb-5 flex items-center gap-2 text-xs text-slate-500"><Keyboard size={14} /> {text({ en: "Manual fallback", tr: "Manuel alternatif" })}</div>
          <div className="grid gap-3"><div className="field"><label>{text({ en: "Event ID", tr: "Etkinlik kimliği" })}</label><input className="input mono" inputMode="numeric" value={eventId} onChange={event => { reset(); setEventId(event.target.value); }} placeholder="1" /></div><div className="field"><label>{text({ en: "Participant wallet", tr: "Katılımcı cüzdanı" })}</label><input className="input mono text-xs" value={participant} onChange={event => { reset(); setParticipant(event.target.value); }} placeholder="0x…" /></div><div className="field"><label>{text({ en: "Or paste full QR payload", tr: "Veya tüm QR verisini yapıştır" })}</label><input className="input mono text-xs" value={payload} onChange={event => parse(event.target.value)} placeholder="p2pass:84532:1:0x…" /></div></div>
          {scanError && <div className="mt-3 flex gap-2 text-xs text-red-400"><ShieldAlert size={14} className="shrink-0" /> {scanError}</div>}
          {checkingChain && <div className="mt-4 bg-white/[.035] p-3 text-xs text-slate-400">{text({ en: "Validating pass and scanner authority on Base Sepolia…", tr: "Pass ve tarayıcı yetkisi Base Sepolia'da doğrulanıyor…" })}</div>}
          {!checkingChain && valid && !scannerAddress && <ScannerWarning message={text({ en: "Connect the organizer or an authorized scanner wallet.", tr: "Organizatör veya yetkili tarayıcı cüzdanını bağla." })} />}
          {!checkingChain && valid && scannerAddress && eventRead.isError && <ScannerWarning message={text({ en: "This event could not be read from Base Sepolia.", tr: "Bu etkinlik Base Sepolia'dan okunamadı." })} />}
          {!checkingChain && eventDetails?.cancelled && <ScannerWarning message={text({ en: "This event is cancelled.", tr: "Bu etkinlik iptal edilmiş." })} />}
          {!checkingChain && eventDetails && !eventDetails.cancelled && passRead.data === false && <ScannerWarning message={text({ en: "This wallet does not own a pass for the event.", tr: "Bu cüzdan etkinlik için bir pass sahibi değil." })} />}
          {!checkingChain && eventDetails && passRead.data === true && alreadyAttended && <ScannerWarning message={text({ en: "This participant is already checked in.", tr: "Bu katılımcının check-in işlemi zaten yapılmış." })} />}
          {!checkingChain && eventDetails && passRead.data === true && !alreadyAttended && !windowOpen && <ScannerWarning message={text({ en: "Check-in opens at the event start time and closes at its end time.", tr: "Check-in etkinlik başlangıcında açılır ve bitişinde kapanır." })} />}
          {!checkingChain && eventDetails && passRead.data === true && !alreadyAttended && windowOpen && !scannerAuthorized && scannerAddress && <ScannerWarning message={text({ en: "The connected wallet is not an authorized scanner for this event.", tr: "Bağlı cüzdan bu etkinlik için yetkili tarayıcı değil." })} />}
          {canCheckIn && <div className="mt-4 flex items-center gap-2 bg-green-400/6 p-3 text-xs font-semibold text-green-400"><Check size={15} /> {text({ en: "Pass, event window and scanner authority verified on-chain", tr: "Pass, etkinlik zamanı ve tarayıcı yetkisi on-chain doğrulandı" })}</div>}
          <button disabled={!canCheckIn || isPending} onClick={() => writeContract({ address: contracts.core, abi: coreAbi, functionName: "checkIn", args: [BigInt(numericEventId), participant as Address] })} className="btn-primary mt-5 w-full">{text({ en: "Verify attendance", tr: "Katılımı doğrula" })}</button>
          {!contractsReady && <p className="mt-3 text-center text-xs text-amber-400">Configure contracts before scanning live passes.</p>}
          <TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} />
        </div>
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-slate-500">{text({ en: "The QR contains no secret. Only the organizer or approved staff wallet can execute check-in.", tr: "QR herhangi bir sır içermez. Check-in işlemini yalnızca organizatör veya yetkili ekip cüzdanı yapabilir." })}</p>
    </div>
  );
}

function ScannerWarning({ message }: { message: string }) {
  return <div className="mt-4 flex gap-2 bg-red-400/6 p-3 text-xs text-red-400"><ShieldAlert size={14} className="shrink-0" /> {message}</div>;
}
