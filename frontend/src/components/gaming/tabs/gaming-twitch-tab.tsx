"use client";

import { TwitchWidget } from "../twitch-widget";
import { TwitchDvrSection } from "../twitch-dvr-section";

export function GamingTwitchTab() {
  return (
    <div className="flex flex-col gap-8">
      <TwitchWidget showManagement={true} />
      <TwitchDvrSection />
    </div>
  );
}
