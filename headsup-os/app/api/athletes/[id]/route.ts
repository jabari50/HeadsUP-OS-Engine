import { EngineError, getAthlete } from "@/lib/engine";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    return Response.json(await getAthlete(id));
  } catch (err) {
    if (err instanceof EngineError) {
      return Response.json({ detail: err.message }, { status: err.status });
    }
    return Response.json({ detail: "Unexpected engine error." }, { status: 500 });
  }
}
