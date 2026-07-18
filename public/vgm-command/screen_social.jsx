// screen_social.jsx → Program Social Aggregation
const { Panel, Eyebrow, Avatar } = window;
const { useState, useMemo } = React;

const PLATFORM = {
  X:          { dot: "#E7E9EA", label: "X" },
  Instagram:  { dot: "#D6589F", label: "Instagram" },
  Hudl:       { dot: "#F58020", label: "Hudl" },
  MaxPreps:   { dot: "#2E7DD1", label: "MaxPreps" },
  YouTube:    { dot: "#FF4E45", label: "YouTube" },
};
const TAG_COLOR = {
  Highlight: "var(--teal)", Announcement: "var(--white)", Stats: "#2E7DD1",
  Recruiting: "var(--gold)", Personal: "var(--gray)", Recap: "var(--teal)",
};

function PlatformBadge({ platform }) {
  const p = PLATFORM[platform] || { dot: "var(--gray)", label: platform };
  return (
    <span className="mono-cap" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9.5, color: "var(--gray)", border: "1px solid var(--hair-2)", borderRadius: 5, padding: "4px 9px" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: p.dot }}></span>{p.label}
    </span>
  );
}

function Metric({ n, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 5 }}>
      <span className="stat" style={{ fontSize: 14, color: "var(--white)" }}>{n}</span>
      <span style={{ fontSize: 11, color: "var(--gray)" }}>{label}</span>
    </span>
  );
}

function PostCard({ post }) {
  const tagC = TAG_COLOR[post.tag] || "var(--gray)";
  return (
    <Panel pad="0" style={{ overflow: "hidden", borderLeft: post.flagged ? "3px solid #FF6B5E" : "1px solid var(--hair)" }}>
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={post.author} size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--white)", display: "flex", alignItems: "center", gap: 8 }}>
              {post.author}
              {post.authorType === "program" && <span className="mono-cap" style={{ fontSize: 8.5, color: "var(--teal)", border: "1px solid var(--teal-line)", borderRadius: 4, padding: "2px 6px" }}>Program</span>}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--gray)", marginTop: 2 }}>{post.handle} · {post.time}</div>
          </div>
          <PlatformBadge platform={post.platform} />
        </div>

        <div style={{ fontSize: 13.5, color: "var(--white)", lineHeight: 1.55 }}>{post.text}</div>

        {post.media && (
          <div style={{ height: 150, borderRadius: 9, background: "repeating-linear-gradient(135deg, var(--navy-700) 0 10px, var(--navy-750) 10px 20px)", border: "1px solid var(--hair-2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span className="mono-cap" style={{ fontSize: 10, color: "var(--gray)" }}>{post.tag === "Highlight" || post.tag === "Recap" ? "Video clip" : "Photo"}</span>
          </div>
        )}

        {post.flagged && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(255,107,94,0.1)", border: "1px solid rgba(255,107,94,0.4)" }}>
            <span className="mono-cap" style={{ fontSize: 9, color: "#FF6B5E", border: "1px solid rgba(255,107,94,0.5)", borderRadius: 4, padding: "3px 7px", flex: "0 0 auto" }}>Flagged</span>
            <span style={{ fontSize: 11.5, color: "var(--white)" }}>{post.flagReason}</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 18, borderTop: "1px solid var(--hair)", paddingTop: 12 }}>
          <span className="mono-cap" style={{ fontSize: 9, color: tagC, border: `1px solid ${tagC}`, borderRadius: 4, padding: "3px 8px", opacity: 0.9 }}>{post.tag}</span>
          <span style={{ flex: 1 }}></span>
          <Metric n={post.likes} label="likes" />
          <Metric n={post.comments} label="replies" />
          <Metric n={post.shares} label="shares" />
        </div>
      </div>
    </Panel>
  );
}

function SocialScreen() {
  const S = window.VGM.SOCIAL;
  const [platform, setPlatform] = useState("All");
  const [author, setAuthor] = useState("All"); // All | program | player

  const list = useMemo(() => S.posts.filter(p =>
    (platform === "All" || p.platform === platform) &&
    (author === "All" || p.authorType === author)
  ), [platform, author]);

  const flagged = S.posts.filter(p => p.flagged);
  const top = [...S.posts].sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares)).slice(0, 4);

  const platChips = ["All", ...S.platforms];

  return (
    <div className="screen-enter" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14 }}>
        <div>
          <Eyebrow>Program Social</Eyebrow>
          <h1 className="head" style={{ fontSize: "clamp(30px,3.6vw,44px)", margin: "8px 0 0" }}>Social Aggregation</h1>
          <div style={{ fontSize: 12.5, color: "var(--gray)", marginTop: 6 }}>{S.account.name} · {S.account.handle} · aggregating {S.platforms.length} connected platforms</div>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--gap)" }}>
        {S.summary.map(s => (
          <Panel key={s.label} pad="18px 20px">
            <Eyebrow color="var(--gray)" style={{ fontSize: 10 }}>{s.label}</Eyebrow>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 8 }}>
              <span className="stat" style={{ fontSize: 38, color: s.label === "Flagged for Review" ? "#FF6B5E" : "var(--teal)", lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontSize: 11.5, color: "var(--gray)", fontWeight: 500 }}>{s.sub}</span>
            </div>
          </Panel>
        ))}
      </div>

      {/* Filters */}
      <Panel pad="16px 18px" style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)", marginRight: 2 }}>Platform</span>
          {platChips.map(p => {
            const on = platform === p;
            return <button key={p} onClick={() => setPlatform(p)} style={{ border: `1px solid ${on ? "var(--teal-line)" : "var(--hair-2)"}`, background: on ? "var(--teal-dim)" : "transparent", color: on ? "var(--teal)" : "var(--gray)", borderRadius: 999, padding: "7px 14px", fontSize: 12, fontWeight: 600 }}>{p}</button>;
          })}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="mono-cap" style={{ fontSize: 9.5, color: "var(--gray)", marginRight: 2 }}>Source</span>
          {[["All", "All"], ["program", "Program"], ["player", "Players"]].map(([k, l]) => {
            const on = author === k;
            return <button key={k} onClick={() => setAuthor(k)} style={{ border: `1px solid ${on ? "var(--teal-line)" : "var(--hair-2)"}`, background: on ? "var(--teal-dim)" : "transparent", color: on ? "var(--teal)" : "var(--gray)", borderRadius: 999, padding: "7px 14px", fontSize: 12, fontWeight: 600 }}>{l}</button>;
          })}
        </div>
      </Panel>

      {/* Feed + rail */}
      <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: "var(--gap)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {list.length === 0
            ? <Panel pad="40px" style={{ textAlign: "center", color: "var(--gray)" }}>No posts match these filters.</Panel>
            : list.map(p => <PostCard key={p.id} post={p} />)}
        </div>

        <div className="dash-rail" style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <Panel style={{ borderTop: "2px solid #FF6B5E" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Eyebrow color="#FF6B5E">Needs Review</Eyebrow>
              <span style={{ fontSize: 12, color: "var(--gray)" }}>{flagged.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {flagged.map(p => (
                <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 12, borderBottom: "1px solid var(--hair)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--white)" }}>{p.author}</span>
                    <PlatformBadge platform={p.platform} />
                  </div>
                  <span style={{ fontSize: 11.5, color: "var(--gray)", lineHeight: 1.5 }}>{p.flagReason}</span>
                  <button style={{ alignSelf: "flex-start", padding: "6px 14px", borderRadius: 7, border: "1px solid var(--teal-line)", background: "var(--teal-dim)", color: "var(--teal)", fontSize: 11.5, fontWeight: 600 }}>Review & Resolve</button>
                </div>
              ))}
            </div>
          </Panel>

          <Panel>
            <Eyebrow style={{ marginBottom: 14 }}>Top Engagement</Eyebrow>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {top.map((p, i) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: i < top.length - 1 ? "1px solid var(--hair)" : "none" }}>
                  <span className="stat" style={{ fontSize: 20, color: "var(--teal)", width: 22, flex: "0 0 auto" }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--white)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.author}</div>
                    <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{p.platform} · {p.tag}</div>
                  </div>
                  <span className="stat" style={{ fontSize: 15, color: "var(--white)", flex: "0 0 auto" }}>{(p.likes + p.comments + p.shares).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

window.SocialScreen = SocialScreen;
