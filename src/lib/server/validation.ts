import type { AnalysisRequest, AnalysisType, SatelliteSource, TimeRange } from "@/types";

const ANALYSIS_TYPES: AnalysisType[] = [
  "vegetation",
  "deforestation",
  "urban",
  "water",
  "agriculture",
  "fire",
  "soil",
  "carbon",
];

const TIME_RANGES: TimeRange[] = ["7d", "30d", "90d", "180d", "365d"];
const SATELLITES: SatelliteSource[] = ["sentinel2", "landsat8", "sentinel1", "modis"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function validateAnalysisRequest(payload: unknown): { valid: true; value: AnalysisRequest } | { valid: false; error: string } {
  if (!isObject(payload)) {
    return { valid: false, error: "Payload must be a JSON object" };
  }

  const region = typeof payload.region === "string" ? payload.region.trim() : "";
  if (region.length < 2) {
    return { valid: false, error: "Region is required and must be at least 2 characters" };
  }

  const analysisType = payload.analysisType as AnalysisType;
  const timeRange = payload.timeRange as TimeRange;
  const satellite = payload.satellite as SatelliteSource;

  if (!ANALYSIS_TYPES.includes(analysisType)) {
    return { valid: false, error: "Invalid analysisType" };
  }
  if (!TIME_RANGES.includes(timeRange)) {
    return { valid: false, error: "Invalid timeRange" };
  }
  if (!SATELLITES.includes(satellite)) {
    return { valid: false, error: "Invalid satellite" };
  }

  let coordinates: { lat: number; lon: number } | undefined;
  if (payload.coordinates !== undefined) {
    if (!isObject(payload.coordinates)) {
      return { valid: false, error: "coordinates must be an object with lat/lon" };
    }
    const lat = Number(payload.coordinates.lat);
    const lon = Number(payload.coordinates.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return { valid: false, error: "Invalid coordinates. Expected lat [-90..90], lon [-180..180]" };
    }
    coordinates = { lat, lon };
  }

  const notes = typeof payload.notes === "string" ? payload.notes.trim().slice(0, 500) : undefined;

  return {
    valid: true,
    value: {
      region,
      analysisType,
      timeRange,
      satellite,
      coordinates,
      notes,
    },
  };
}

