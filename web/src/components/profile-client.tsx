"use client";

import { ExternalLink, Link as LinkIcon, Pencil, ShieldCheck, Star, TicketCheck, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import type { Address } from "viem";
import { useAccount, useReadContract, useReadContracts, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi, reputationAbi } from "@/lib/contracts";
import { shortAddress } from "@/lib/utils";
import { TransactionStatus } from "./transaction-status";
import { PeerRatingForm } from "./peer-rating-form";
import type { ChainEvent } from "./onchain-event-list";
import { useUIPreferences } from "./ui-preferences";

type ReviewTuple = { proofEventId: bigint; rating: number; comment: string; updatedAt: bigint };

export function ProfileClient({ profileAddress }: { profileAddress: Address }) {
  const { text } = useUIPreferences();
  const { address } = useAccount();
  const [editing, setEditing] = useState(false);
  const profileRead = useReadContract({ address: contracts.reputation, abi: reputationAbi, functionName: "getProfile", args: [profileAddress], query: { enabled: contractsReady } });
  const ratingRead = useReadContract({ address: contracts.reputation, abi: reputationAbi, functionName: "peerAverage", args: [profileAddress], query: { enabled: contractsReady } });
  const peerReviewsRead = useReadContract({ address: contracts.reputation, abi: reputationAbi, functionName: "getPeerReviews", args: [profileAddress], query: { enabled: contractsReady } });
  const joinedRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getJoinedEvents", args: [profileAddress], query: { enabled: contractsReady } });
  const createdRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getCreatedEvents", args: [profileAddress], query: { enabled: contractsReady } });
  const joinedIds = joinedRead.data?.map(Number) ?? [];
  const joinedEventReads = useReadContracts({
    contracts: joinedIds.map(id => ({ address: contracts.core, abi: coreAbi, functionName: "getEvent" as const, args: [BigInt(id)] })),
    query: { enabled: contractsReady && joinedIds.length > 0 },
  });
  const attendanceReads = useReadContracts({
    contracts: joinedIds.map(id => ({ address: contracts.core, abi: coreAbi, functionName: "attended" as const, args: [BigInt(id), profileAddress] })),
    query: { enabled: contractsReady && joinedIds.length > 0 },
  });
  const profile = profileRead.data;
  const isOwner = address?.toLowerCase() === profileAddress.toLowerCase();
  const displayName = profile?.displayName || profile?.username || shortAddress(profileAddress, 7);
  const identity = profile?.username ? `@${profile.username}` : shortAddress(profileAddress, 7);
  const bio = profile?.bio || text({ en: "This wallet has not added an on-chain bio yet.", tr: "Bu cüzdan henüz on-chain biyografi eklemedi." });
  const rating = ratingRead.data ? (Number(ratingRead.data) / 100).toFixed(1) : "—";
  const attended = attendanceReads.data?.filter(result => result.status === "success" && result.result === true).length ?? 0;
  const created = createdRead.data?.length ?? 0;
  const [reviewers, peerReviews] = (peerReviewsRead.data ?? [[], []]) as readonly [readonly Address[], readonly ReviewTuple[]];

  if (!contractsReady) return <div className="shell py-14"><div className="panel p-12 text-center"><h1 className="text-xl font-semibold">{text({ en: "Contract configuration required", tr: "Kontrat yapılandırması gerekli" })}</h1><p className="mt-2 text-sm text-slate-500">{text({ en: "No profile data is substituted when the live deployment is unavailable.", tr: "Canlı deployment ulaşılamadığında profil verisi yerine başka veri gösterilmez." })}</p></div></div>;
  if (profileRead.isError || ratingRead.isError || joinedRead.isError || createdRead.isError || peerReviewsRead.isError) return <div className="shell py-14"><div className="panel p-12 text-center"><h1 className="text-xl font-semibold">{text({ en: "Profile could not be read", tr: "Profil okunamadı" })}</h1><p className="mt-2 text-sm text-slate-500">{text({ en: "Check the Base Sepolia RPC connection and try again.", tr: "Base Sepolia RPC bağlantısını kontrol edip tekrar dene." })}</p></div></div>;

  return (
    <div className="shell py-14">
      <section className="grid gap-8 border-b border-white/10 pb-12 md:grid-cols-[160px_1fr_auto] md:items-end">
        <div className="event-art tone-amber grid aspect-square place-items-center border border-white/12"><div className="event-art-grid" /><span className="relative text-5xl font-semibold">{displayName.slice(0,2).toUpperCase()}</span></div>
        <div><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-green-400"><ShieldCheck size={14} /> ON-CHAIN PROFILE</div><h1 className="page-title !text-[clamp(2.4rem,5vw,4.8rem)]">{displayName}</h1><div className="mono mt-3 text-sm text-slate-500">{profileAddress}</div><p className="mt-5 max-w-2xl leading-7 text-slate-400">{bio}</p>{profile?.link && <a href={profile.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-[var(--brand)]"><LinkIcon size={14} /> {profile.link} <ExternalLink size={12} /></a>}</div>
        {isOwner && <button className="btn-secondary" onClick={() => setEditing(!editing)}><Pencil size={15} /> {text({ en: "Edit profile", tr: "Profili düzenle" })}</button>}
      </section>

      {editing && <ProfileEditor current={profile} onClose={() => setEditing(false)} />}

      <section className="grid border-b border-white/10 sm:grid-cols-4 sm:divide-x sm:divide-white/10">
        <Stat label={text({ en: "PEER RATING", tr: "KİŞİ PUANI" })} value={rating} icon={<Star fill="#f59e0b" color="#f59e0b" />} />
        <Stat label={text({ en: "EVENTS ATTENDED", tr: "KATILDIĞI ETKİNLİK" })} value={attendanceReads.isLoading ? "—" : String(attended)} icon={<UserRoundCheck />} />
        <Stat label={text({ en: "EVENTS CREATED", tr: "OLUŞTURDUĞU ETKİNLİK" })} value={String(created)} icon={<TicketCheck />} />
        <Stat label={text({ en: "IDENTITY", tr: "KİMLİK" })} value={identity} small icon={<ShieldCheck />} />
      </section>

      <div className="grid gap-12 py-12 lg:grid-cols-[1fr_360px]">
        <section><div className="eyebrow">{text({ en: "ON-CHAIN HISTORY", tr: "ON-CHAIN GEÇMİŞ" })}</div><h2 className="section-title mt-3">{text({ en: "Pass & attendance ledger", tr: "Pass ve katılım kaydı" })}</h2>{joinedRead.isLoading ? <div className="mt-7 border-y border-white/8 py-10 text-center text-sm text-slate-500">{text({ en: "Reading Base Sepolia…", tr: "Base Sepolia okunuyor…" })}</div> : joinedIds.length === 0 ? <div className="mt-7 border-y border-white/8 py-10 text-center text-sm text-slate-500">{text({ en: "This wallet has no event passes yet.", tr: "Bu cüzdanın henüz etkinlik pass'i yok." })}</div> : <div className="mt-7 divide-y divide-white/8 border-y border-white/8">{joinedIds.slice(0,5).map((id, index) => {
          const eventResult = joinedEventReads.data?.[index];
          const event = eventResult?.status === "success" ? eventResult.result as ChainEvent : undefined;
          const attendanceResult = attendanceReads.data?.[index];
          const wasAttended = attendanceResult?.status === "success" && attendanceResult.result === true;
          return <div key={id} className="flex items-center justify-between gap-4 py-5"><div><div className="text-sm font-semibold">{event?.name ?? `Event #${id}`}</div><div className="mt-1 text-xs text-slate-500">EVENT #{String(id).padStart(3,"0")} · BASE SEPOLIA</div></div><span className={`flex items-center gap-2 text-xs font-bold ${wasAttended ? "text-green-400" : "text-slate-500"}`}><ShieldCheck size={14} /> {wasAttended ? text({ en: "ATTENDED", tr: "KATILDI" }) : text({ en: "PASS ACTIVE", tr: "PASS AKTİF" })}</span></div>;
        })}</div>}</section>
        <section><div className="panel p-5"><div className="eyebrow">{text({ en: "PEER REPUTATION", tr: "KİŞİ İTİBARI" })}</div><div className="mt-5 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-.06em]">{rating}</span><span className="mb-1 text-sm text-slate-500">/ 5.0</span></div><p className="mt-4 text-sm leading-6 text-slate-500">{text({ en: "Every review is backed by an event both wallets actually attended.", tr: "Her değerlendirme, iki cüzdanın da gerçekten katıldığı bir etkinlikle desteklenir." })}</p><div className="mt-5 divide-y divide-white/8 border-t border-white/8">{peerReviewsRead.isLoading ? <div className="py-4 text-xs text-slate-500">{text({ en: "Reading peer reviews…", tr: "Kişi yorumları okunuyor…" })}</div> : peerReviews.length === 0 ? <div className="py-4 text-xs text-slate-500">{text({ en: "No verified peer review yet.", tr: "Henüz doğrulanmış kişi yorumu yok." })}</div> : peerReviews.slice(0, 5).map((review, index) => <article key={reviewers[index]} className="py-4"><div className="flex items-center justify-between gap-3"><span className="mono text-[10px] text-slate-500">{shortAddress(reviewers[index], 5)} · EVENT #{Number(review.proofEventId)}</span><span className="flex items-center gap-1 text-xs"><Star size={11} fill="#f59e0b" color="#f59e0b" /> {review.rating}/5</span></div><p className="mt-2 text-xs leading-5 text-slate-300">{review.comment || text({ en: "Rating recorded without a comment.", tr: "Yorumsuz puan kaydedildi." })}</p></article>)}</div></div>{address && !isOwner && <PeerRatingForm target={profileAddress} />}</section>
      </div>
    </div>
  );
}

type ProfileTuple = { username: string; displayName: string; bio: string; avatarURI: string; link: string; updatedAt: bigint } | undefined;

function ProfileEditor({ current, onClose }: { current: ProfileTuple; onClose: () => void }) {
  const { text } = useUIPreferences();
  const [form, setForm] = useState({ username: current?.username || "", displayName: current?.displayName || "", bio: current?.bio || "", avatarURI: current?.avatarURI || "", link: current?.link || "" });
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(value => ({ ...value, [key]: event.target.value }));
  return <section className="my-8 panel p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><div><div className="eyebrow">{text({ en: "PROFILE TRANSACTION", tr: "PROFİL İŞLEMİ" })}</div><h2 className="mt-2 text-xl font-semibold">{text({ en: "Edit on-chain metadata", tr: "On-chain profilini düzenle" })}</h2></div><button onClick={onClose} className="btn-quiet">{text({ en: "Close", tr: "Kapat" })}</button></div><div className="grid gap-4 sm:grid-cols-2"><div className="field"><label>{text({ en: "Username", tr: "Kullanıcı adı" })} <span className="float-right text-[10px] text-[var(--muted)]">{form.username.length}/64</span></label><input maxLength={64} className="input" value={form.username} onChange={update("username")} /></div><div className="field"><label>{text({ en: "Display name", tr: "Görünen ad" })} <span className="float-right text-[10px] text-[var(--muted)]">{form.displayName.length}/96</span></label><input maxLength={96} className="input" value={form.displayName} onChange={update("displayName")} /></div><div className="field sm:col-span-2"><label>{text({ en: "Bio", tr: "Biyografi" })} <span className="float-right text-[10px] text-[var(--muted)]">{form.bio.length}/500</span></label><textarea maxLength={500} className="textarea" value={form.bio} onChange={update("bio")} /></div><div className="field"><label>{text({ en: "Avatar IPFS URI", tr: "Avatar IPFS adresi" })}</label><input maxLength={256} className="input" value={form.avatarURI} onChange={update("avatarURI")} /></div><div className="field"><label>{text({ en: "Website or social link", tr: "Web sitesi veya sosyal bağlantı" })}</label><input maxLength={256} className="input" value={form.link} onChange={update("link")} /></div></div><button disabled={isPending || !contractsReady} onClick={() => writeContract({ address: contracts.reputation, abi: reputationAbi, functionName: "updateProfile", args: [form.username, form.displayName, form.bio, form.avatarURI, form.link] })} className="btn-primary mt-5">{text({ en: "Save profile on-chain", tr: "Profili on-chain kaydet" })}</button><TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} /></section>;
}

function Stat({ label, value, icon, small }: { label: string; value: string; icon: React.ReactNode; small?: boolean }) { return <div className="flex items-center gap-4 py-6 sm:px-6 first:pl-0 last:pr-0 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-[var(--brand)]"><span>{icon}</span><div><div className="eyebrow !text-slate-600">{label}</div><div className={`mt-1 font-semibold ${small ? "text-sm" : "text-2xl"}`}>{value}</div></div></div>; }
