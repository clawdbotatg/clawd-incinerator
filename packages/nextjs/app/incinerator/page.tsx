"use client";

import type { NextPage } from "next";
import { IncineratorPanel } from "./_components/IncineratorPanel";
import { RecentBurns } from "./_components/RecentBurns";

const IncineratorPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="text-center pt-12 pb-8 px-4">
        <h1 className="text-5xl font-black text-white mb-2">
          🔥 <span className="bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">INCINERATOR</span> 🔥
        </h1>
        <p className="text-zinc-500 max-w-sm mx-auto">
          Call <code className="text-orange-400 text-sm">incinerate()</code> to burn $CLAWD and earn a reward.
        </p>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 pb-16 space-y-8">
        <IncineratorPanel />
        <RecentBurns />
      </div>
    </div>
  );
};

export default IncineratorPage;
