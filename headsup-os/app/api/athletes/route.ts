import { EngineError, listAthletes, onboardAthlete } from "@/lib/engine";

function errorResponse(err: unknown): Response {
  if (err instanceof EngineError) {
    return Response.json({ detail: err.message }, { status: err.status });
  }
  return Response.json({ detail: "Unexpected engine error." }, { status: 500 });
}

export async function GET() {
  try {
    return Response.json(await listAthletes());
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ detail: "Request body must be valid JSON." }, { status: 400 });
  }

  try {
    const profile = await onboardAthlete(payload);
    return Response.json(profile, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
