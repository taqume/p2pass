"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, UserRound, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getAddress, isAddress, parseAbiItem, type Address } from "viem";
import { usePublicClient } from "wagmi";
import { contracts, contractsReady, reputationDeploymentBlock } from "@/lib/contracts";
import { shortAddress } from "@/lib/utils";
import { useUIPreferences } from "./ui-preferences";

type ProfileResult = { account: Address; username: string; displayName: string };
const profileUpdated = parseAbiItem("event ProfileUpdated(address indexed account, string username, string displayName)");

export function ProfileSearch({ mobile = false }: { mobile?: boolean }) {
  const router = useRouter();
  const publicClient = usePublicClient();
  const { text } = useUIPreferences();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const normalized = query.trim().toLowerCase();

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setSearched(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    if (normalized.length < 2 || isAddress(query.trim()) || !publicClient || !contractsReady) {
      setSearched(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const logs = await publicClient.getLogs({
          address: contracts.reputation,
          event: profileUpdated,
          fromBlock: reputationDeploymentBlock,
          toBlock: "latest",
        });
        const latest = new Map<string, ProfileResult>();
        for (const log of logs) {
          if (!log.args.account) continue;
          latest.set(log.args.account.toLowerCase(), {
            account: log.args.account,
            username: log.args.username ?? "",
            displayName: log.args.displayName ?? "",
          });
        }
        setProfiles([...latest.values()].filter(profile =>
          profile.username.toLowerCase().includes(normalized)
          || profile.displayName.toLowerCase().includes(normalized),
        ).slice(0, 6));
        setSearched(true);
      } catch {
        setProfiles([]);
        setSearched(true);
      } finally {
        setLoading(false);
      }
    }, 280);
    return () => window.clearTimeout(timer);
  }, [normalized, publicClient, query]);

  const addressTarget = useMemo(() => isAddress(query.trim()) ? getAddress(query.trim()) : undefined, [query]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (addressTarget) {
      setSearched(false);
      router.push(`/profile/${addressTarget}`);
    } else if (normalized.length >= 2) {
      setSearched(true);
    }
  };

  return <div ref={rootRef} className={`profile-search ${mobile ? "is-mobile" : ""}`}>
    <form onSubmit={submit} className="profile-search-form" role="search">
      <Search size={15} aria-hidden="true" />
      <input value={query} onChange={event => setQuery(event.target.value)} onFocus={() => normalized.length >= 2 && setSearched(true)} placeholder={text({ en: "Username or 0x address", tr: "Kullanıcı adı veya 0x adresi" })} aria-label={text({ en: "Search on-chain profiles", tr: "On-chain profillerde ara" })} />
      {query && <button type="button" onClick={() => { setQuery(""); setSearched(false); }} aria-label={text({ en: "Clear search", tr: "Aramayı temizle" })}><X size={13} /></button>}
    </form>
    {searched && <div className="profile-search-results">
      {addressTarget ? <Link href={`/profile/${addressTarget}`} onClick={() => setSearched(false)} className="profile-search-result"><UserRound size={15} /><span><strong>{text({ en: "Open wallet profile", tr: "Cüzdan profilini aç" })}</strong><small>{shortAddress(addressTarget, 7)}</small></span></Link>
        : loading ? <div className="profile-search-empty">{text({ en: "Reading Base Sepolia…", tr: "Base Sepolia okunuyor…" })}</div>
          : profiles.length ? profiles.map(profile => <Link key={profile.account} href={`/profile/${profile.account}`} onClick={() => setSearched(false)} className="profile-search-result"><UserRound size={15} /><span><strong>{profile.username ? `@${profile.username}` : profile.displayName}</strong><small>{profile.displayName || shortAddress(profile.account, 6)} · {shortAddress(profile.account, 4)}</small></span></Link>)
            : <div className="profile-search-empty">{text({ en: "No matching on-chain profile.", tr: "Eşleşen on-chain profil bulunamadı." })}</div>}
    </div>}
  </div>;
}
