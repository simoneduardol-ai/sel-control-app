"use client";

import { useState } from "react";

const TABS = [
  { key: "visitas", label: "Visitas" },
  { key: "cotizaciones", label: "Cotizaciones" },
  { key: "obras", label: "Obras" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function DashboardTabs({
  visitas,
  cotizaciones,
  obras,
}: {
  visitas: React.ReactNode;
  cotizaciones: React.ReactNode;
  obras: React.ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("visitas");
  const content = { visitas, cotizaciones, obras };

  return (
    <div className="px-5 py-4 md:hidden">
      <div className="flex gap-1 bg-surface rounded-xl p-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
              active === tab.key
                ? "bg-accent text-accent-text"
                : "text-text-dim"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {content[active]}
    </div>
  );
}
