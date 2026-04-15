import { notFound } from "next/navigation";

import AddTeamForm from "@/components/AddTeamForm";
import EventLeaderboard from "@/components/EventLeaderboard";
import { ensureSingleEvent, getEventBySlug, getTeamsForEvent } from "@/lib/queries";
import { isAllowedEventSlug } from "@/lib/singleEvent";

type PageProps = { params: Promise<{ slug: string }> };

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isAllowedEventSlug(slug)) notFound();

  await ensureSingleEvent();
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const teams = await getTeamsForEvent(event.id);

  return (
    <div className="pg-shell mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-black tracking-tight">
          {event.title}
        </h1>
        <p className="mt-1 text-sm text-[#424242]">
          Barcelona Pub Golf · <span className="font-mono">/e/{event.slug}</span>
        </p>
      </div>

      <EventLeaderboard
        eventId={event.id}
        eventSlug={event.slug}
        course={event.course}
        initialTeams={teams}
      />

      <AddTeamForm eventSlug={event.slug} />
    </div>
  );
}
