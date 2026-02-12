"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatEther } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const CLAWD_TOKEN_ADDRESS = "0x9f86dB9fc6f7c9408e8Fda3Ff8ce4e78ac7a6b07";

function useClawdPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CLAWD_TOKEN_ADDRESS}`);
      const data = await res.json();
      const pairs = data?.pairs;
      if (pairs?.[0]?.priceUsd) {
        setPrice(parseFloat(pairs[0].priceUsd));
      }
    } catch {
      /* silently fail — USD display is optional */
    }
  }, []);

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return price;
}

export function IncineratorPanel() {
  const [isIncinerating, setIsIncinerating] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const { address: connectedAddress, chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { switchChain } = useSwitchChain();
  const isWrongNetwork = chain && chain.id !== targetNetwork.id;

  // Read contract state
  const { data: canBurn } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "canIncinerate",
  });

  const { data: timeUntilNext } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "timeUntilNextBurn",
  });

  const { data: burnAmount } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "burnAmount",
  });

  const { data: callerReward } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "callerReward",
  });

  const { data: totalBurned } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "totalBurned",
  });

  const { data: totalCalls } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "totalCalls",
  });

  const { data: clawdBalance } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "clawdBalance",
  });

  const { data: _cooldownSeconds } = useScaffoldReadContract({
    contractName: "Incinerator",
    functionName: "cooldownSeconds",
  });
  void _cooldownSeconds; // used for future display

  const { writeContractAsync: writeIncinerator } = useScaffoldWriteContract({ contractName: "Incinerator" });

  const clawdPrice = useClawdPrice();

  const formatUsd = (clawdAmount: bigint | undefined) => {
    if (!clawdAmount || !clawdPrice) return "";
    const tokens = Number(formatEther(clawdAmount));
    const usd = tokens * clawdPrice;
    if (usd >= 1000) return `~$${(usd / 1000).toFixed(1)}K`;
    if (usd >= 1) return `~$${usd.toFixed(2)}`;
    return `~$${usd.toFixed(4)}`;
  };

  // Countdown timer — use a target timestamp to avoid glitches from contract re-fetches
  const targetTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeUntilNext === undefined) return;
    const contractSeconds = Number(timeUntilNext);
    const newTarget = Date.now() + contractSeconds * 1000;

    // Only update the target if it differs meaningfully (>2s) from current,
    // preventing re-fetch jitter from resetting the countdown
    if (targetTimeRef.current === null || Math.abs(newTarget - targetTimeRef.current) > 2000) {
      targetTimeRef.current = newTarget;
      setCountdown(contractSeconds);
    }
  }, [timeUntilNext]);

  useEffect(() => {
    if (targetTimeRef.current === null) return;
    const tick = () => {
      const remaining = Math.max(0, Math.round((targetTimeRef.current! - Date.now()) / 1000));
      setCountdown(remaining);
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTimeRef.current]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const formatClawd = (value: bigint | undefined) => {
    if (!value) return "0";
    const num = Number(formatEther(value));
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const handleIncinerate = async () => {
    setIsIncinerating(true);
    try {
      await writeIncinerator({ functionName: "incinerate" });
      notification.success("🔥 INCINERATED! You earned " + formatClawd(callerReward) + " $CLAWD");
    } catch (e: any) {
      console.error("Incineration failed:", e);
      if (e?.message?.includes("Cooldown")) {
        notification.error("⏱️ Cooldown not elapsed yet!");
      } else if (e?.message?.includes("Not enough")) {
        notification.error("Contract is empty — no CLAWD to burn!");
      } else {
        notification.error("Failed: " + (e?.shortMessage || e?.message || "Unknown error"));
      }
    } finally {
      setIsIncinerating(false);
    }
  };

  const isReady = canBurn && countdown === 0;
  const isCoolingDown = countdown > 0;
  const isEmpty = !canBurn && countdown === 0;

  const getButtonText = () => {
    if (isIncinerating) return "🔥 Burning...";
    if (isReady) return "🔥 INCINERATE 🔥";
    if (isCoolingDown) return `⏱️ ${formatTime(countdown)}`;
    if (isEmpty) return "💀 No CLAWD to burn";
    return "⏱️ Loading...";
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md mx-auto text-center">
      {/* Countdown or Ready */}
      <div className="mb-8">
        {countdown > 0 ? (
          <>
            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Next burn in</div>
            <div className="text-5xl font-mono font-bold text-white tabular-nums">{formatTime(countdown)}</div>
          </>
        ) : (
          <>
            <div className="text-orange-400 text-xs uppercase tracking-wider mb-2 animate-pulse">Ready to burn</div>
            <div className="text-5xl font-mono font-bold text-orange-400">🔥🔥🔥</div>
          </>
        )}
      </div>

      {/* Burn info */}
      <div className="mb-6 space-y-1">
        <div className="text-zinc-400 text-sm">
          Burns <span className="text-orange-400 font-mono font-bold">{formatClawd(burnAmount)}</span> $CLAWD
          {formatUsd(burnAmount) && <span className="text-zinc-600 text-xs ml-1">({formatUsd(burnAmount)})</span>}
        </div>
        <div className="text-zinc-400 text-sm">
          Caller earns <span className="text-green-400 font-mono font-bold">{formatClawd(callerReward)}</span> $CLAWD
          {formatUsd(callerReward) && <span className="text-zinc-600 text-xs ml-1">({formatUsd(callerReward)})</span>}
        </div>
      </div>

      {/* Action button */}
      <div className="mb-8">
        {!connectedAddress ? (
          <div className="text-zinc-500 py-4 text-sm">Connect wallet to incinerate</div>
        ) : isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: targetNetwork.id })}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl transition-colors"
          >
            Switch to {targetNetwork.name}
          </button>
        ) : (
          <button
            disabled={!isReady || isIncinerating}
            onClick={handleIncinerate}
            className={`w-full font-bold py-4 rounded-xl transition-all text-lg ${
              isReady && !isIncinerating
                ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-600/30 hover:shadow-orange-500/40"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {getButtonText()}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 border-t border-zinc-800 pt-6">
        <div>
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Total Burned</div>
          <div className="text-orange-400 font-mono font-bold text-lg">{formatClawd(totalBurned)}</div>
          {formatUsd(totalBurned) && <div className="text-zinc-600 text-[10px] font-mono">{formatUsd(totalBurned)}</div>}
        </div>
        <div>
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Burns</div>
          <div className="text-white font-mono font-bold text-lg">{totalCalls?.toString() || "0"}</div>
        </div>
        <div>
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Remaining</div>
          <div className="text-green-400 font-mono font-bold text-lg">{formatClawd(clawdBalance)}</div>
          {formatUsd(clawdBalance) && <div className="text-zinc-600 text-[10px] font-mono">{formatUsd(clawdBalance)}</div>}
        </div>
      </div>
    </div>
  );
}
