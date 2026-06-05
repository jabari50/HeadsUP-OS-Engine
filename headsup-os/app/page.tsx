const pipelines = [
  {
    id: 1,
    name: "Circuit Intelligence",
    description: "EYBL + 3SSB scraping, enrichment, and prospect scoring",
    route: "/circuit",
    status: "active",
    color: "from-blue-600 to-blue-800",
  },
  {
    id: 2,
    name: "Scrape-to-Send",
    description: "Neural Data Agency — score, prototype, deploy client sites",
    route: "/pipeline",
    status: "active",
    color: "from-violet-600 to-violet-800",
  },
  {
    id: 3,
    name: "Athlete ProQuest",
    description: "Intake gate, dashboard stack, and athlete profile management",
    route: "/proquest",
    status: "active",
    color: "from-emerald-600 to-emerald-800",
  },
  {
    id: 4,
    name: "NIL Recruiting",
    description: "NIL strategy docs, recruiting intelligence, and advisory content",
    route: "/nil",
    status: "building",
    color: "from-amber-600 to-amber-800",
  },
  {
    id: 5,
    name: "Scouting Reports",
    description: "Structured player scouting reports and DFW landscape coverage",
    route: "/scouting",
    status: "building",
    color: "from-orange-600 to-orange-800",
  },
  {
    id: 6,
    name: "Contact Database",
    description: "CRM — segment, organize, and activate the contact network",
    route: "/crm",
    status: "building",
    color: "from-cyan-600 to-cyan-800",
  },
  {
    id: 7,
    name: "Social Content Engine",
    description: "Platform-optimized content, captions, and content calendars",
    route: "/social",
    status: "building",
    color: "from-pink-600 to-pink-800",
  },
  {
    id: 8,
    name: "HeadsUP Digital",
    description: "Client intake briefs, proposal decks, and digital project scopes",
    route: "/digital",
    status: "building",
    color: "from-indigo-600 to-indigo-800",
  },
  {
    id: 9,
    name: "Foundation Curricula",
    description: "Youth development curriculum modules and program outlines",
    route: "/foundation",
    status: "building",
    color: "from-teal-600 to-teal-800",
  },
];

const statusLabel: Record<string, string> = {
  active: "LIVE",
  building: "BUILDING",
};

const statusDot: Record<string, string> = {
  active: "bg-green-400",
  building: "bg-yellow-400",
};

export default function CommandCenter() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-widest text-zinc-500 uppercase">
            We Scout From The Neck Up.
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
            Command Center
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
          9 Pipelines
        </div>
      </header>

      <main className="px-8 py-10 max-w-6xl mx-auto">
        <p className="text-sm text-zinc-400 mb-8">
          Select a pipeline to enter its workspace.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map((p) => (
            <a
              key={p.id}
              href={p.route}
              className="group relative flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition-all hover:border-zinc-600 hover:bg-zinc-800"
            >
              <div
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-xs font-bold text-white`}
              >
                {p.id}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="font-semibold text-white text-sm leading-tight">
                    {p.name}
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-zinc-400">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDot[p.status]}`} />
                    {statusLabel[p.status]}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 group-hover:text-zinc-400 transition-colors text-lg">
                →
              </span>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
