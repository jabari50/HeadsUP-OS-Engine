"use client";

/* Screen 1b — Coach Sign-Up (Claude Design prototype:
   screens-onboarding.jsx → SignUpScreen). Demo flow — feeds the
   Coach DNA wizard. */

import React from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "@/components/vgm/ui";

export default function SignUpPage() {
  const router = useRouter();
  const [f, setF] = React.useState({
    name: "D. Walker",
    school: "Red Oak HS",
    email: "coach.walker@redoakisd.org",
  });
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <div
      className="court-tex fade-in"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "calc(var(--u)*3)",
        gap: 22,
      }}
    >
      <Wordmark light />
      <div
        className="card-light"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "calc(var(--u)*3.5)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="t-display" style={{ fontSize: 28, color: "var(--navy)" }}>
          Build your front office
        </div>
        <p style={{ fontSize: 13, color: "var(--mid)", marginTop: 4 }}>
          Free during the pilot. No card required.
        </p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}
        >
          <label>
            <span className="t-label" style={{ display: "block", marginBottom: 5 }}>
              Coach name
            </span>
            <input className="field" value={f.name} onChange={set("name")}></input>
          </label>
          <label>
            <span className="t-label" style={{ display: "block", marginBottom: 5 }}>
              School / program
            </span>
            <input className="field" value={f.school} onChange={set("school")}></input>
          </label>
          <label>
            <span className="t-label" style={{ display: "block", marginBottom: 5 }}>
              Email
            </span>
            <input className="field" value={f.email} onChange={set("email")}></input>
          </label>
          <button
            className="btn btn-primary"
            style={{ marginTop: 8, width: "100%", padding: "14px" }}
            onClick={() => router.push("/wizard")}
          >
            Create My Front Office →
          </button>
          <p style={{ fontSize: 11, color: "var(--mid)", textAlign: "center", margin: 0 }}>
            Next: your Coach DNA intake — about 3 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
