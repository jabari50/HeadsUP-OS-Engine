import NilScanner from '@/components/NilScanner';

export const metadata = {
  title: 'NIL Contract Scanner — SOVEREIGN | HeadsUp OS',
  description: 'SOVEREIGN advisory intelligence for NIL contract risk analysis.',
};

interface PageProps {
  searchParams: { athlete_id?: string; role?: string };
}

/**
 * /nil-scan — SOVEREIGN NIL Contract Risk Scanner page.
 *
 * Accepts optional query params:
 *   ?athlete_id=<uuid>  — pre-populates the athlete ID field
 *   ?role=<role>        — pre-selects the role dropdown
 *
 * Example deep-link from the athlete dashboard:
 *   /nil-scan?athlete_id=e7f1d051-b038-42e0-ae76-bed7ba63a50f&role=Athlete
 */
export default function NilScanPage({ searchParams }: PageProps) {
  return (
    <NilScanner
      defaultAthleteId={searchParams.athlete_id ?? ''}
      defaultRole={searchParams.role ?? 'Athlete'}
    />
  );
}
