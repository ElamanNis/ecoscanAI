import type { SatelliteDataSource, SatelliteScene, SatelliteSource, TimeRange } from "@/types";

type StacFeature = {
  id: string;
  collection: string;
  properties?: {
    datetime?: string;
    "eo:cloud_cover"?: number;
    platform?: string;
  };
};

function toDatetime(range: TimeRange): string {
  const end = new Date();
  const start = new Date(end);
  const days: Record<TimeRange, number> = { "7d": 7, "30d": 30, "90d": 90, "180d": 180, "365d": 365 };
  start.setUTCDate(start.getUTCDate() - days[range]);
  return `${start.toISOString()}/${end.toISOString()}`;
}

function collectionForSatellite(source: SatelliteSource): string | null {
  if (source === "sentinel2") return "sentinel-2-l2a";
  if (source === "landsat8") return "landsat-c2-l2";
  if (source === "sentinel1") return "sentinel-1-grd";
  return null;
}

async function safeFetchStac(collection: string, lat: number, lon: number, datetime: string): Promise<StacFeature[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch("https://earth-search.aws.element84.com/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collections: [collection],
        datetime,
        limit: 8,
        intersects: {
          type: "Point",
          coordinates: [lon, lat],
        },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { features?: StacFeature[] };
    return Array.isArray(data.features) ? data.features : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSatelliteDataSource(lat: number, lon: number, timeRange: TimeRange, source: SatelliteSource): Promise<SatelliteDataSource> {
  const collection = collectionForSatellite(source);
  if (!collection) {
    return {
      provider: "simulation",
      usedLiveData: false,
      sceneCount: 0,
      scenes: [],
    };
  }

  const features = await safeFetchStac(collection, lat, lon, toDatetime(timeRange));
  if (!features.length) {
    return {
      provider: "simulation",
      usedLiveData: false,
      sceneCount: 0,
      qualityScore: 46,
      scenes: [],
    };
  }

  const scenes: SatelliteScene[] = features.map((f) => ({
    id: f.id,
    collection: f.collection,
    datetime: f.properties?.datetime || new Date().toISOString(),
    cloudCover: typeof f.properties?.["eo:cloud_cover"] === "number" ? f.properties["eo:cloud_cover"] : undefined,
    platform: f.properties?.platform,
  }));
  const clouds = scenes.filter((s) => typeof s.cloudCover === "number").map((s) => s.cloudCover as number);
  const avgCloudCover = clouds.length ? parseFloat((clouds.reduce((a, b) => a + b, 0) / clouds.length).toFixed(1)) : undefined;
  const latestSceneAt = scenes
    .map((s) => s.datetime)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  const freshnessDays = latestSceneAt
    ? Math.max(0, Math.round((Date.now() - new Date(latestSceneAt).getTime()) / (1000 * 60 * 60 * 24)))
    : undefined;
  const cloudPenalty = avgCloudCover !== undefined ? Math.min(35, avgCloudCover * 0.7) : 8;
  const recencyPenalty = freshnessDays !== undefined ? Math.min(22, freshnessDays * 1.3) : 10;
  const qualityScore = Math.max(40, Math.min(98, Math.round(100 - cloudPenalty - recencyPenalty + Math.min(8, scenes.length))));

  return {
    provider: "stac-earth-search",
    usedLiveData: true,
    sceneCount: scenes.length,
    avgCloudCover,
    latestSceneAt,
    freshnessDays,
    qualityScore,
    scenes,
  };
}
