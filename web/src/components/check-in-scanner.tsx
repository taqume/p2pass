"use client";

import { Camera, Check, Keyboard, ScanLine, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isAddress, type Address } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi } from "@/lib/contracts";
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
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  const parse = useCallback((raw: string) => {
    setPayload(raw);
    const match = raw.match(/^p2pass:84532:(\d+):(0x[a-fA-F0-9]{40})$/);
    if (!match) { setScanError(text({ en: "This is not a valid Base Sepolia P2Pass QR payload.", tr: "Bu geçerli bir Base Sepolia P2Pass QR verisi değil." })); return; }
    setEventId(match[1]); setParticipant(match[2]); setScanError(undefined); setCameraOn(false);
  }, [text]);

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

  const valid = Number(eventId) > 0 && isAddress(participant);
  return (
    <div className="mx-auto max-w-lg">
      <div className="overflow-hidden border border-white/12 bg-[#111827]">
        <div className="flex items-center justify-between border-b border-white/10 p-4"><div><div className="eyebrow">{text({ en: "AUTHORIZED SCANNER", tr: "YETKİLİ TARAYICI" })}</div><div className="mt-1 text-sm font-semibold">Base Sepolia check-in</div></div><span className="status-dot text-green-400" /></div>
        <div className="relative aspect-square bg-[#070b14]">
          {cameraOn ? <video ref={videoRef} className="h-full w-full object-cover" muted playsInline /> : <div className="absolute inset-0 grid place-items-center text-center"><div><div className="relative mx-auto grid h-40 w-40 place-items-center border border-amber-400/35"><span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-amber-400" /><span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-amber-400" /><span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-amber-400" /><span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-amber-400" /><ScanLine size={42} className="text-amber-400" /></div><button onClick={() => setCameraOn(true)} className="btn-primary mt-6"><Camera size={16} /> {text({ en: "Start camera", tr: "Kamerayı başlat" })}</button></div></div>}
        </div>
        <div className="p-5">
          <div className="mb-5 flex items-center gap-2 text-xs text-slate-500"><Keyboard size={14} /> {text({ en: "Manual fallback", tr: "Manuel alternatif" })}</div>
          <div className="grid gap-3"><div className="field"><label>{text({ en: "Event ID", tr: "Etkinlik kimliği" })}</label><input className="input mono" inputMode="numeric" value={eventId} onChange={event => setEventId(event.target.value)} placeholder="1" /></div><div className="field"><label>{text({ en: "Participant wallet", tr: "Katılımcı cüzdanı" })}</label><input className="input mono text-xs" value={participant} onChange={event => setParticipant(event.target.value)} placeholder="0x…" /></div><div className="field"><label>{text({ en: "Or paste full QR payload", tr: "Veya tüm QR verisini yapıştır" })}</label><input className="input mono text-xs" value={payload} onChange={event => parse(event.target.value)} placeholder="p2pass:84532:1:0x…" /></div></div>
          {scanError && <div className="mt-3 flex gap-2 text-xs text-red-400"><ShieldAlert size={14} className="shrink-0" /> {scanError}</div>}
          {valid && <div className="mt-4 flex items-center gap-2 bg-green-400/6 p-3 text-xs font-semibold text-green-400"><Check size={15} /> {text({ en: "Valid pass payload · ready to verify on-chain", tr: "Geçerli pass verisi · on-chain doğrulamaya hazır" })}</div>}
          <button disabled={!valid || !contractsReady || isPending} onClick={() => writeContract({ address: contracts.core, abi: coreAbi, functionName: "checkIn", args: [BigInt(eventId), participant as Address] })} className="btn-primary mt-5 w-full">{text({ en: "Verify attendance", tr: "Katılımı doğrula" })}</button>
          {!contractsReady && <p className="mt-3 text-center text-xs text-amber-400">Configure contracts before scanning live passes.</p>}
          <TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} />
        </div>
      </div>
      <p className="mt-5 text-center text-xs leading-5 text-slate-500">{text({ en: "The QR contains no secret. Only the organizer or approved staff wallet can execute check-in.", tr: "QR herhangi bir sır içermez. Check-in işlemini yalnızca organizatör veya yetkili ekip cüzdanı yapabilir." })}</p>
    </div>
  );
}
