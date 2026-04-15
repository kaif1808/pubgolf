## Learned User Preferences

- When building or changing Pub Golf UI, align styling with `pubgolf.html` and the shared `:root` variables in `globals.css` (warm cream/forest/terracotta tokens and `pg-accent*`), rather than introducing unrelated ad hoc hex colors in components.

## Learned Workspace Facts

- SQL migrations in `supabase/migrations/` must be applied to the **same** Supabase project whose URL is in `NEXT_PUBLIC_SUPABASE_URL` for the Vercel deployment. Applying migrations only to a different Supabase project leaves tables like `public.events` missing and causes PostgREST / `ensureSingleEvent` failures in production.
