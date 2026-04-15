"use client";

import { useState } from "react";
import type { Course } from "@/lib/course";
import type { TeamRow } from "@/lib/queries";
import type { PlayerSlot } from "@/lib/scoring";
import PlayerScorecard from "@/components/PlayerScorecard";

type Props = {
  course: Course;
  team: TeamRow;
  eventSlug: string;
};

const SLOTS: PlayerSlot[] = ["p1", "p2", "p3"];

export default function TeamHubScorecard({ course, team, eventSlug }: Props) {
  const [slot, setSlot] = useState<PlayerSlot>("p1");

  const tokens: Record<PlayerSlot, string> = {
    p1: team.player_token_1,
    p2: team.player_token_2,
    p3: team.player_token_3,
  };

  const labels: Record<PlayerSlot, string> = {
    p1: team.player_1,
    p2: team.player_2,
    p3: team.player_3,
  };

  return (
    <div className="space-y-4">
      <div className="no-print rounded-sm border-2 border-pg-black bg-pg-white p-4 shadow-lg">
        <h2 className="mb-2 font-[family-name:var(--font-playfair)] text-lg font-black">
          Enter scores as…
        </h2>
        <p className="mb-3 text-sm text-pg-gray-700">
          Choose who you are; only that player&apos;s column and penalty tally are editable here.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              className={`pg-btn w-full text-sm sm:w-auto ${
                slot === s
                  ? "border-pg-accent bg-pg-accent-muted/35 text-pg-black ring-1 ring-pg-accent/50"
                  : ""
              }`}
              onClick={() => setSlot(s)}
            >
              {labels[s]}
            </button>
          ))}
        </div>
      </div>

      <PlayerScorecard
        key={slot}
        course={course}
        team={team}
        eventSlug={eventSlug}
        playerToken={tokens[slot]}
        slot={slot}
        showEditingBanner={false}
      />
    </div>
  );
}
