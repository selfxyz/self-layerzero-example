"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type SourceEvent = { txHash: string; blockNumber: number; user: string; dstEid: number; configId: string };
type DestEvent = { txHash: string; blockNumber: number; user: string; srcEid: number; timestamp: number };

export default function StatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userFilter = (searchParams.get("user") || "").toLowerCase();
  const [src, setSrc] = useState<SourceEvent[]>([]);
  const [dst, setDst] = useState<DestEvent[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredSrc = useMemo(() => (
    userFilter ? src.filter(e => e.user.toLowerCase() === userFilter) : src
  ), [src, userFilter]);
  const filteredDst = useMemo(() => (
    userFilter ? dst.filter(e => e.user.toLowerCase() === userFilter) : dst
  ), [dst, userFilter]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const run = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/status");
        const data = await res.json();
        setSrc(data.src ?? []);
        setDst(data.dst ?? []);
        setWarnings(data.warnings ?? []);
      } catch (e) {
        setWarnings(["Failed to fetch status"]); 
      } finally {
        setLoading(false);
      }
    };
    run();
    // Higher frequency here: 5s
    timer = setInterval(run, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gray-50 p-6 sm:p-8 md:p-10">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-xl font-semibold text-gray-800 mb-3">Cross-chain Status</h1>
        <div className="flex gap-2 justify-center mb-3">
          <button onClick={() => router.push("/")} className="px-3 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-sm">Back to QR</button>
          <button onClick={() => location.reload()} className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-sm">Refresh</button>
        </div>
        {userFilter && (
          <div className="mb-3 text-sm text-gray-600">Filtering by user: <span className="font-mono">{userFilter}</span></div>
        )}
        {warnings.length > 0 && (
          <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 inline-block text-left">
            {warnings.map((w, i) => (<div key={i}>{w}</div>))}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="bg-white rounded-lg border p-3">
            <div className="text-sm font-semibold text-gray-700 mb-2">Source (Celo)</div>
            {loading && <div className="text-xs text-gray-500 mb-2">Loading…</div>}
            {filteredSrc.length === 0 && <div className="text-xs text-gray-500">No recent sends</div>}
            {filteredSrc.map((e, i) => (
              <div key={`src-${i}`} className="text-xs text-gray-700 mb-2">
                <div>User: {e.user}</div>
                <div className="truncate">Tx: <a className="text-blue-600 underline" href={`${process.env.NEXT_PUBLIC_SOURCE_EXPLORER}/tx/${e.txHash}`} target="_blank" rel="noreferrer">{e.txHash}</a></div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-lg border p-3">
            <div className="text-sm font-semibold text-gray-700 mb-2">Destination (Base)</div>
            {loading && <div className="text-xs text-gray-500 mb-2">Loading…</div>}
            {filteredDst.length === 0 && <div className="text-xs text-gray-500">No recent receipts</div>}
            {filteredDst.map((e, i) => (
              <div key={`dst-${i}`} className="text-xs text-gray-700 mb-2">
                <div>User: {e.user}</div>
                <div className="truncate">Tx: <a className="text-blue-600 underline" href={`${process.env.NEXT_PUBLIC_DEST_EXPLORER}/tx/${e.txHash}`} target="_blank" rel="noreferrer">{e.txHash}</a></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
