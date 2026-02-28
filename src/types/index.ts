export interface AnalysisRequest {
  region: string;
  coordinates?: { lat: number; lon: number };
  analysisType: AnalysisType;
  timeRange: TimeRange;
  satellite: SatelliteSource;
  notes?: string;
}

export type AnalysisType = "vegetation" | "deforestation" | "urban" | "water" | "agriculture" | "fire" | "soil" | "carbon";
export type TimeRange = "7d" | "30d" | "90d" | "180d" | "365d";
export type SatelliteSource = "sentinel2" | "landsat8" | "sentinel1" | "modis";

export interface LandUseBreakdown {
  forest: number;
  agriculture: number;
  urban: number;
  water: number;
  bare: number;
}

export interface AnalysisResult {
  id: string;
  region: string;
  coordinates: { lat: number; lon: number };
  timestamp: string;
  analysisType: AnalysisType;
  satellite: SatelliteSource;
  ndvi: number;
  ndviCategory: string;
  landUse: LandUseBreakdown;
  changePercent: number;
  confidence: number;
  processingTime: number;
  alerts: Alert[];
  spectralBands: SpectralBand[];
  modelInfo: ModelInfo;
  meta?: ApiResponseMeta;
  geminiSummary?: string;
  geminiInsights?: string[];
  geminiRecommendations?: string[];
  riskScore?: number;
  riskLevel?: string;
  additionalIndices?: { evi: number; savi: number; ndwi: number; bsi: number };
  soil?: SoilAnalysis;
  dataSource?: SatelliteDataSource;
  full?: FullAnalysisResult;
}

export interface Alert {
  type: "deforestation" | "drought" | "flood" | "fire" | "urban_growth";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
}

export interface SpectralBand {
  name: string;
  value: number;
  unit: string;
}

export interface ModelInfo {
  name: string;
  version: string;
  accuracy: number;
  source: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export interface SoilAnalysis {
  moisture: number;
  organicMatter: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  salinity: number;
}

export interface MonthlyActionPlan {
  month: string;
  objective: string;
  actions: string[];
  kpi: string;
  riskLevel: "Low" | "Moderate" | "High" | "Critical";
}

export interface PlanRequest {
  analysis: AnalysisResult;
  months: 3 | 6 | 12;
  goal?: string;
}

export interface PlanResponse {
  region: string;
  generatedAt: string;
  horizonMonths: number;
  summary: string;
  plans: MonthlyActionPlan[];
  meta?: ApiResponseMeta;
}

export interface ApiResponseMeta {
  apiVersion: string;
  plan: "free" | "pro" | "enterprise";
  remainingPerMinute: number | null;
}

export interface ApiClientContext {
  plan: "free" | "pro" | "enterprise";
  keyId: string;
  requestLimitPerMinute: number;
}

export interface ApiKeyRecord extends ApiClientContext {
  apiKey: string;
  active: boolean;
  createdAt: string;
  lastUsedAt?: string;
  label?: string;
}

export interface SatelliteScene {
  id: string;
  datetime: string;
  collection: string;
  cloudCover?: number;
  platform?: string;
}

export interface SatelliteDataSource {
  provider: "stac-earth-search" | "simulation";
  usedLiveData: boolean;
  sceneCount: number;
  avgCloudCover?: number;
  latestSceneAt?: string;
  freshnessDays?: number;
  qualityScore?: number;
  scenes: SatelliteScene[];
}

export interface FullAnalysisGeminiResult {
  available: boolean;
  error?: string;
  headline: string;
  summary: string;
  insights: string[];
  recommendations: Array<{ priority: "critical" | "high" | "medium" | "low"; category: string; action: string; timeframe: string }>;
  agriAdvisory: {
    soilCondition: string;
    irrigationNeeded: boolean;
    irrigationAmount: string;
    bestCrops: string[];
    avoidCrops: string[];
    plantingWindow: string;
    harvestOutlook: string;
    fertilizerAdvice: string;
    pestRisk: string;
  } | null;
  climateContext: string;
  forecast7dSummary: string;
  waterResourcesSummary: string;
  model: string;
}

export interface FullAnalysisResult {
  id: string;
  timestamp: string;
  processingMs: number;
  location: {
    displayName: string;
    city: string;
    region: string;
    country: string;
    countryCode: string;
    lat: number;
    lon: number;
    elevation: number | null;
    timezone: string;
  };
  climate: {
    period: { start: string; end: string; days: number };
    temperature: { avg: number | null; max: number | null; min: number | null; anomaly: number | null };
    precipitation: { total: number | null; daily_avg: number | null; anomaly_pct: number | null };
    solar: { avg: number | null; unit: "W/m2" };
    humidity: { avg: number | null; unit: "%" };
    wind: { avg: number | null; max: number | null; unit: "km/h" };
    dewPoint: number | null;
    pressure: number | null;
    dataSource: "NASA POWER API";
    apiSuccess: boolean;
  };
  current: {
    temperature: number | null;
    feelsLike: number | null;
    humidity: number | null;
    windSpeed: number | null;
    windDirection: number | null;
    pressure: number | null;
    cloudCover: number | null;
    weatherCode: number | null;
    weatherDescription: string;
    precipitation: number | null;
    soilMoisture: number | null;
    soilTemp: number | null;
    dataSource: "Open-Meteo API";
    apiSuccess: boolean;
  };
  forecast: {
    days: Array<{
      date: string;
      tempMax: number | null;
      tempMin: number | null;
      precipSum: number | null;
      precipProbability: number | null;
      et0: number | null;
      soilMoisture: number | null;
      sunshineHours: number | null;
      windMax: number | null;
    }>;
    weeklyTotal: { precipitation: number; avgTemp: number | null; totalET0: number };
    dataSource: "Open-Meteo API";
    apiSuccess: boolean;
  };
  satellite: {
    scenes: Array<{
      id: string;
      date: string;
      cloudCoverPct: number | null;
      orbitDirection: string;
      processingLevel: string;
      mission: string;
    }>;
    totalScenes: number;
    latestDate: string | null;
    avgCloudCover: number | null;
    bestScene: string | null;
    dataSource: "Copernicus STAC API";
    apiSuccess: boolean;
  };
  indices: {
    ndvi: number;
    ndviHealth: { category: string; description: string; color: string };
    evi: number;
    savi: number;
    ndwi: number;
    droughtIndex: number;
    lstProxy: number;
    carbonProxy: number;
    fireRisk: number;
    floodRisk: number;
    methodology: string;
  };
  landUse: {
    forest: number;
    agriculture: number;
    urban: number;
    water: number;
    bare: number;
    grassland: number;
    wetland: number;
    osmDataAvailable: boolean;
  };
  risks: {
    overall: { level: "Low" | "Moderate" | "High" | "Critical"; score: number };
    factors: {
      drought: { level: string; score: number; detail: string };
      heat: { level: string; score: number; detail: string };
      flood: { level: string; score: number; detail: string };
      fire: { level: string; score: number; detail: string };
      frost: { level: string; score: number; detail: string };
      erosion: { level: string; score: number; detail: string };
      waterStress: { level: string; score: number; detail: string };
      soilDegradation: { level: string; score: number; detail: string };
    };
  };
  gemini: FullAnalysisGeminiResult;
  dataSources: Record<string, { success: boolean; latency?: number; error?: string }>;
  confidence: number;
}
