import Link from "next/link";
import { notFound } from "next/navigation";

import PlayerScorecard from "@/components/PlayerScorecard";
import PrintButton from "@/components/PrintButton";
import { getEventForTeam, getTeamById } from "@/lib/queries";
import { slotFromPlayerToken } from "@/lib/playerToken";

type PageProps = {
  params: Promise<{ slug: string; teamId: string; playerToken: string }>;
};

export default async function PlayerEntryPage({ params }: PageProps) {
  const { slug, teamId, playerToken } = await params;
  const team = await getTeamById(teamId);
  if (!team) notFound();

  const event = await getEventForTeam(team);
  if (!event || event.slug !== slug) notFound();

  const slot = slotFromPlayerToken(team, playerToken);
  if (!slot) notFound();

  return (
    <div className="pg-shell mx-auto max-w-4xl space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm underline" href={`/e/${slug}/t/${teamId}`}>
          ← Team hub
        </Link>
        <PrintButton />
      </div>

      <PlayerScorecard
        course={event.course}
        team={team}
        eventSlug={slug}
        playerToken={playerToken}
        slot={slot}
      />
    </div>
  );
}
