import Link from "next/link";
import { notFound } from "next/navigation";

import PlayerLinks from "@/components/PlayerLinks";
import PrintButton from "@/components/PrintButton";
import TeamHubScorecard from "@/components/TeamHubScorecard";
import { getEventForTeam, getTeamById } from "@/lib/queries";

type PageProps = { params: Promise<{ slug: string; teamId: string }> };

export default async function TeamHubPage({ params }: PageProps) {
  const { slug, teamId } = await params;
  const team = await getTeamById(teamId);
  if (!team) notFound();

  const event = await getEventForTeam(team);
  if (!event || event.slug !== slug) notFound();

  return (
    <div className="pg-shell mx-auto max-w-4xl space-y-8">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            className="text-sm text-pg-accent underline decoration-pg-accent-muted underline-offset-2 hover:text-pg-accent-hover"
            href={`/e/${slug}`}
          >
            ← Leaderboard
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-black">{team.name}</h1>
        </div>
        <PrintButton />
      </div>

      <PlayerLinks
        eventSlug={slug}
        teamId={team.id}
        tokens={{
          p1: team.player_token_1,
          p2: team.player_token_2,
          p3: team.player_token_3,
        }}
        labels={{ p1: team.player_1, p2: team.player_2, p3: team.player_3 }}
      />

      <TeamHubScorecard course={event.course} team={team} eventSlug={slug} />
    </div>
  );
}
