"use client";

import { Address } from "@scaffold-ui/components";
import { formatEther } from "viem";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

export function RecentBurns() {
  const { data: events, isLoading } = useScaffoldEventHistory({
    contractName: "Incinerator",
    eventName: "Incinerated",
    fromBlock: BigInt(42000000),
    watch: true,
  });

  const recentEvents = (events || []).slice(0, 20);

  const formatClawd = (value: bigint) => {
    const num = Number(formatEther(value));
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md mx-auto">
      <h2 className="text-lg font-bold text-white mb-4">🔥 Burn Log</h2>

      {isLoading ? (
        <div className="text-zinc-600 text-center py-8 text-sm">Loading...</div>
      ) : recentEvents.length === 0 ? (
        <div className="text-zinc-600 text-center py-8 text-sm">No burns yet. Be the first caller! 🔥</div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {recentEvents.map((event, i) => {
            const caller = event.args.caller as string;
            const burned = event.args.amountBurned as bigint;
            const reward = event.args.callerRewardPaid as bigint;

            return (
              <div
                key={`${event.transactionHash}-${i}`}
                className="flex items-center justify-between bg-zinc-800 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-orange-500 text-sm">🔥</span>
                  <Address address={caller} size="xs" />
                </div>
                <div className="text-right">
                  <div className="text-orange-400 font-mono text-xs">-{formatClawd(burned)}</div>
                  <div className="text-green-400 font-mono text-[10px]">+{formatClawd(reward)} reward</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
