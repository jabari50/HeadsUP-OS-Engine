/**
 * SOVEREIGN — VerbalCommits Portal Monitor
 * Polls VerbalCommits transfer portal for athlete entry events.
 * Server-side only — fetch + regex parsing, no Playwright dependency.
 *
 * ZHR: returns null for any field that cannot be confirmed from source HTML.
 */

export interface PortalEntry {
  athleteName: string;
  position: string | null;
  school: string | null;
  enteredAt: string | null;
  eligibilityYears: string | null;
  sourceUrl: string;
  confirmed: boolean;
}

export interface PortalCheckResult {
  found: boolean;
  entries: PortalEntry[];
  checkedAt: string;
  sourceReachable: boolean;
}

const VERBALCOMMITS_PORTAL_URL =
  "https://verbalcommits.com/portal";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; HeadsUP-OS-SOVEREIGN/1.0; +https://headsupos.netlify.app)",
  Accept: "text/html",
};

// Extracts portal entries matching a given athlete name from VerbalCommits HTML
function parsePortalEntries(html: string, athleteName: string): PortalEntry[] {
  const entries: PortalEntry[] = [];
  const nameLower = athleteName.toLowerCase().trim();

  // VerbalCommits renders rows with athlete names in anchor tags within table rows.
  // Pattern: <tr ...><td ...><a ...>Name</a></td><td>Position</td><td>School</td>...
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const anchorPattern = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i;
  const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").trim();

  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    cellPattern.lastIndex = 0;
    while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }

    if (cells.length < 2) continue;
    const rowText = cells.join(" ").toLowerCase();
    if (!rowText.includes(nameLower)) continue;

    // Try to extract href from the name cell for source URL
    const hrefMatch = anchorPattern.exec(rowHtml);
    const href = hrefMatch?.[1] ?? null;
    const sourceUrl = href
      ? href.startsWith("http")
        ? href
        : `https://verbalcommits.com${href}`
      : VERBALCOMMITS_PORTAL_URL;

    entries.push({
      athleteName: cells[0] || athleteName,
      position: cells[1] || null,
      school: cells[2] || null,
      enteredAt: cells[3] || null,
      eligibilityYears: cells[4] || null,
      sourceUrl,
      confirmed: true,
    });
  }

  return entries;
}

export async function checkPortalStatus(
  athleteName: string
): Promise<PortalCheckResult> {
  const checkedAt = new Date().toISOString();

  let html: string;
  try {
    const res = await fetch(VERBALCOMMITS_PORTAL_URL, {
      headers: HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { found: false, entries: [], checkedAt, sourceReachable: false };
    }
    html = await res.text();
  } catch {
    return { found: false, entries: [], checkedAt, sourceReachable: false };
  }

  const entries = parsePortalEntries(html, athleteName);
  return {
    found: entries.length > 0,
    entries,
    checkedAt,
    sourceReachable: true,
  };
}

// Builds SOVEREIGN portal risk context string from a PortalCheckResult
export function formatPortalContextForSovereign(
  result: PortalCheckResult,
  athleteName: string
): string {
  if (!result.sourceReachable) {
    return `Portal check for ${athleteName}: VerbalCommits source was unreachable at ${result.checkedAt}. Verification required.`;
  }
  if (!result.found) {
    return `Portal check for ${athleteName}: No confirmed portal entry found on VerbalCommits as of ${result.checkedAt}. Source reachable.`;
  }

  const entry = result.entries[0];
  return [
    `PORTAL EVENT CONFIRMED — ${athleteName}`,
    `Position: ${entry.position ?? "unconfirmed"}`,
    `Previous school: ${entry.school ?? "unconfirmed"}`,
    `Entered portal: ${entry.enteredAt ?? "unconfirmed"}`,
    `Eligibility remaining: ${entry.eligibilityYears ?? "unconfirmed"}`,
    `Source: ${entry.sourceUrl}`,
    `Checked: ${result.checkedAt}`,
  ].join("\n");
}
