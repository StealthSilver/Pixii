"use client";

import type { PersonaConfig } from "@/lib/ugcVideo/types";

type PersonaSelectorProps = {
  persona: PersonaConfig;
  onChange: (p: PersonaConfig) => void;
};

const STYLES: {
  id: PersonaConfig["style"];
  emoji: string;
  label: string;
}[] = [
  { id: "casual", emoji: "😊", label: "Everyday Person" },
  { id: "professional", emoji: "💼", label: "Professional" },
  { id: "fitness", emoji: "💪", label: "Fitness Enthusiast" },
  { id: "beauty_guru", emoji: "💄", label: "Beauty Creator" },
  { id: "mom", emoji: "👩‍👧", label: "Parent" },
  { id: "student", emoji: "🎓", label: "Student" },
  { id: "entrepreneur", emoji: "🚀", label: "Entrepreneur" },
];

const ETHNICITY_OPTIONS: { value: string; label: string }[] = [
  { value: "not_specified", label: "Not specified" },
  { value: "asian", label: "Asian" },
  { value: "black", label: "Black / African American" },
  { value: "hispanic", label: "Hispanic / Latino" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "south_asian", label: "South Asian" },
  { value: "white", label: "White / Caucasian" },
  { value: "mixed", label: "Mixed / Multiracial" },
];

const pill =
  "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors";
const pillActive = "border-primary bg-primary text-white";
const pillIdle =
  "border-border bg-card text-foreground hover:border-muted-foreground/35";

export function PersonaSelector({ persona, onChange }: PersonaSelectorProps) {
  const inputClass =
    "mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/35";

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-foreground">
        Creator Persona
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Who is creating this video?</p>

      <div className="mt-5 space-y-5">
        <div>
          <p className="text-sm font-medium text-foreground/90">Gender</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["female", "Female"],
                ["male", "Male"],
                ["non_binary", "Non-binary"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={`${pill} ${persona.gender === v ? pillActive : pillIdle}`}
                onClick={() => onChange({ ...persona, gender: v })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground/90">Age Range</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                "18-25",
                "25-35",
                "35-45",
                "45+",
              ] as const
            ).map((v) => (
              <button
                key={v}
                type="button"
                className={`${pill} ${persona.ageRange === v ? pillActive : pillIdle}`}
                onClick={() => onChange({ ...persona, ageRange: v })}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground/90">Creator Style</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ ...persona, style: s.id })}
                className={
                  "flex flex-col items-start rounded-lg border p-3 text-left text-sm transition-colors " +
                  (persona.style === s.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/25"
                    : "border-border bg-card hover:border-muted-foreground/35")
                }
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="mt-1 font-semibold text-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/90">
            Representation
            <select
              value={persona.ethnicity}
              onChange={(e) =>
                onChange({ ...persona, ethnicity: e.target.value })
              }
              className={inputClass}
            >
              {ETHNICITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Select for authentic representation
          </p>
        </div>
      </div>
    </section>
  );
}
