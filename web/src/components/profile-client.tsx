"use client";

import { ExternalLink, Link as LinkIcon, Pencil, ShieldCheck, Star, TicketCheck, UserRoundCheck } from "lucide-react";
import { useState } from "react";
import type { Address } from "viem";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { contracts, contractsReady, coreAbi, reputationAbi } from "@/lib/contracts";
import { shortAddress } from "@/lib/utils";
import { TransactionStatus } from "./transaction-status";
import { PeerRatingForm } from "./peer-rating-form";

export function ProfileClient({ profileAddress }: { profileAddress: Address }) {
  const { address } = useAccount();
  const [editing, setEditing] = useState(false);
  const profileRead = useReadContract({ address: contracts.reputation, abi: reputationAbi, functionName: "getProfile", args: [profileAddress], query: { enabled: contractsReady } });
  const ratingRead = useReadContract({ address: contracts.reputation, abi: reputationAbi, functionName: "peerAverage", args: [profileAddress], query: { enabled: contractsReady } });
  const joinedRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getJoinedEvents", args: [profileAddress], query: { enabled: contractsReady } });
  const createdRead = useReadContract({ address: contracts.core, abi: coreAbi, functionName: "getCreatedEvents", args: [profileAddress], query: { enabled: contractsReady } });
  const profile = profileRead.data;
  const isOwner = address?.toLowerCase() === profileAddress.toLowerCase();
  const displayName = profile?.displayName || (contractsReady ? shortAddress(profileAddress, 7) : "Leyla Nova");
  const username = profile?.username || (contractsReady ? "wallet profile" : "leylanova.eth");
  const bio = profile?.bio || (contractsReady ? "This wallet has not added an on-chain bio yet." : "Protocol designer. I host small rooms for big internet questions and help open-source communities meet in real life.");
  const rating = ratingRead.data ? (Number(ratingRead.data) / 100).toFixed(1) : contractsReady ? "—" : "4.9";
  const joined = joinedRead.data?.length ?? (contractsReady ? 0 : 12);
  const created = createdRead.data?.length ?? (contractsReady ? 0 : 4);

  return (
    <div className="shell py-14">
      {!contractsReady && <div className="mb-6 border-l-2 border-amber-400 bg-amber-400/5 p-3 text-xs text-amber-300">Profile preview mode · deploy contracts to read this address from Base Sepolia.</div>}
      <section className="grid gap-8 border-b border-white/10 pb-12 md:grid-cols-[160px_1fr_auto] md:items-end">
        <div className="event-art tone-violet grid aspect-square place-items-center border border-white/12"><div className="event-art-grid" /><span className="relative text-5xl font-semibold">{displayName.slice(0,2).toUpperCase()}</span></div>
        <div><div className="mb-3 flex items-center gap-2 text-xs font-semibold text-green-400"><ShieldCheck size={14} /> ON-CHAIN PROFILE</div><h1 className="page-title !text-[clamp(2.4rem,5vw,4.8rem)]">{displayName}</h1><div className="mono mt-3 text-sm text-slate-500">{profileAddress}</div><p className="mt-5 max-w-2xl leading-7 text-slate-400">{bio}</p>{profile?.link && <a href={profile.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-[#60a5fa]"><LinkIcon size={14} /> {profile.link} <ExternalLink size={12} /></a>}</div>
        {isOwner && <button className="btn-secondary" onClick={() => setEditing(!editing)}><Pencil size={15} /> Edit profile</button>}
      </section>

      {editing && <ProfileEditor current={profile} onClose={() => setEditing(false)} />}

      <section className="grid border-b border-white/10 sm:grid-cols-4 sm:divide-x sm:divide-white/10">
        <Stat label="PEER RATING" value={rating} icon={<Star fill="#f59e0b" color="#f59e0b" />} />
        <Stat label="EVENTS ATTENDED" value={String(joined)} icon={<UserRoundCheck />} />
        <Stat label="EVENTS CREATED" value={String(created)} icon={<TicketCheck />} />
        <Stat label="IDENTITY" value={`@${username}`} small icon={<ShieldCheck />} />
      </section>

      <div className="grid gap-12 py-12 lg:grid-cols-[1fr_360px]">
        <section><div className="eyebrow">ON-CHAIN HISTORY</div><h2 className="section-title mt-3">Attendance ledger</h2><div className="mt-7 divide-y divide-white/8 border-y border-white/8">{(joinedRead.data?.map(Number) ?? [42,39,36]).slice(0,5).map((id, index) => <div key={id} className="flex items-center justify-between py-5"><div><div className="text-sm font-semibold">{contractsReady ? `Event #${id}` : ["Protocol After Hours", "Base Builders Breakfast", "Commons Table #06"][index]}</div><div className="mt-1 text-xs text-slate-500">EVENT #{String(id).padStart(3,"0")} · BASE SEPOLIA</div></div><span className="flex items-center gap-2 text-xs font-bold text-green-400"><ShieldCheck size={14} /> ATTENDED</span></div>)}</div></section>
        <section><div className="panel p-5"><div className="eyebrow !text-violet-400">PEER REPUTATION</div><div className="mt-5 flex items-end gap-2"><span className="text-5xl font-semibold tracking-[-.06em]">{rating}</span><span className="mb-1 text-sm text-slate-500">/ 5.0</span></div><p className="mt-4 text-sm leading-6 text-slate-500">Every review is backed by an event both wallets actually attended.</p><div className="mt-5 border-l-2 border-violet-400/40 pl-4 text-sm italic leading-6 text-slate-300">“Creates the kind of room where people actually listen.”</div></div>{address && !isOwner && <PeerRatingForm target={profileAddress} />}</section>
      </div>
    </div>
  );
}

type ProfileTuple = { username: string; displayName: string; bio: string; avatarURI: string; link: string; updatedAt: bigint } | undefined;

function ProfileEditor({ current, onClose }: { current: ProfileTuple; onClose: () => void }) {
  const [form, setForm] = useState({ username: current?.username || "", displayName: current?.displayName || "", bio: current?.bio || "", avatarURI: current?.avatarURI || "", link: current?.link || "" });
  const { data: hash, error, isPending, writeContract } = useWriteContract();
  const receipt = useWaitForTransactionReceipt({ hash });
  const update = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(value => ({ ...value, [key]: event.target.value }));
  return <section className="my-8 panel p-5 sm:p-7"><div className="mb-6 flex items-center justify-between"><div><div className="eyebrow">PROFILE TRANSACTION</div><h2 className="mt-2 text-xl font-semibold">Edit on-chain metadata</h2></div><button onClick={onClose} className="btn-quiet">Close</button></div><div className="grid gap-4 sm:grid-cols-2"><div className="field"><label>Username</label><input className="input" value={form.username} onChange={update("username")} /></div><div className="field"><label>Display name</label><input className="input" value={form.displayName} onChange={update("displayName")} /></div><div className="field sm:col-span-2"><label>Bio</label><textarea maxLength={500} className="textarea" value={form.bio} onChange={update("bio")} /></div><div className="field"><label>Avatar IPFS URI</label><input className="input" value={form.avatarURI} onChange={update("avatarURI")} /></div><div className="field"><label>Website or social link</label><input className="input" value={form.link} onChange={update("link")} /></div></div><button disabled={isPending || !contractsReady} onClick={() => writeContract({ address: contracts.reputation, abi: reputationAbi, functionName: "updateProfile", args: [form.username, form.displayName, form.bio, form.avatarURI, form.link] })} className="btn-primary mt-5">Save profile on-chain</button><TransactionStatus hash={hash} isPending={isPending} isConfirming={receipt.isLoading} isSuccess={receipt.isSuccess} error={error} /></section>;
}

function Stat({ label, value, icon, small }: { label: string; value: string; icon: React.ReactNode; small?: boolean }) { return <div className="flex items-center gap-4 py-6 sm:px-6 first:pl-0 last:pr-0 [&_svg]:h-5 [&_svg]:w-5 [&_svg]:text-[#60a5fa]"><span>{icon}</span><div><div className="eyebrow !text-slate-600">{label}</div><div className={`mt-1 font-semibold ${small ? "text-sm" : "text-2xl"}`}>{value}</div></div></div>; }
