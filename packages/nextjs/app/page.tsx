"use client";

import { Address } from "@scaffold-ui/components";
import { IncineratorPanel } from "./incinerator/_components/IncineratorPanel";
import { RecentBurns } from "./incinerator/_components/RecentBurns";

const INCINERATOR_ADDRESS = "0x536453350f2eee2eb8bfee1866baf4fca494a092";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero — no h1, header already shows app name */}
      <div className="text-center pt-12 pb-8 px-4">
        <p className="text-zinc-500 max-w-sm mx-auto">
          Call <code className="text-orange-400 text-sm">incinerate()</code> to burn $CLAWD and earn a reward.
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-8">
        <IncineratorPanel />
        <RecentBurns />

        {/* Contract address */}
        <div className="flex justify-center">
          <div className="text-zinc-500 text-xs flex items-center gap-2">
            <span>Contract:</span>
            <Address address={INCINERATOR_ADDRESS} size="xs" />
          </div>
        </div>
      </div>
    </div>
  );
}
