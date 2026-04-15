import { redirect } from "next/navigation";

import { SINGLE_EVENT_SLUG } from "@/lib/singleEvent";

export default function Home() {
  redirect(`/e/${SINGLE_EVENT_SLUG}`);
}
