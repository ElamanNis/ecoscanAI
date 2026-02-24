type DataSources = Record<string, { success: boolean; latency?: number; error?: string }>;

function label(k: string) {
  const map: Record<string, string> = {
    nasaPower: "NASA POWER",
    openMeteo: "Open-Meteo",
    openMeteoArchive: "Open-Meteo Archive",
    copernicusStac: "Copernicus STAC",
    openElevation: "Open-Elevation",
    nominatim: "Nominatim",
    aiProvider: "AI Provider",
  };
  return map[k] || k;
}

export default function DataSourceBadgeList({ dataSources }: { dataSources: DataSources }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(dataSources).map(([k, v]) => (
        <span
          key={k}
          className="rounded-md border px-2 py-1 font-['JetBrains_Mono'] text-[11px]"
          style={{
            borderColor: v.success ? "rgba(0,255,135,0.35)" : "rgba(255,61,87,0.35)",
            color: v.success ? "#7fe7b3" : "#ff9cb0",
            background: v.success ? "rgba(0,255,135,0.09)" : "rgba(255,61,87,0.1)",
          }}
        >
          {label(k)} {v.success ? "ok" : "fail"} {v.latency ? `${v.latency}ms` : ""}
        </span>
      ))}
    </div>
  );
}
