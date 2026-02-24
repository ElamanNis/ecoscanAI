# 🛰️ EcoScan AI — Satellite Intelligence Platform

> Analyze any region on Earth using AI-powered satellite imagery. Get NDVI scores, land classification, and deforestation alerts in seconds.

![EcoScan AI](https://img.shields.io/badge/Powered%20by-Hugging%20Face-orange?style=flat-square)
![Sentinel-2](https://img.shields.io/badge/Data-Sentinel--2%20ESA-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black?style=flat-square)

---

## 🚀 Quick Start (5 minutes)

### 1. Clone & Install
```bash
git clone https://github.com/your-team/ecoscan-ai.git
cd ecoscan-ai
npm install
```

### 2. Configure API Key
```bash
cp .env.local.example .env.local
# Edit .env.local and add your Hugging Face token:
# HUGGINGFACE_API_KEY=hf_your_token_here
```

Get a **free** Hugging Face token at: https://huggingface.co/settings/tokens

### 3. Run
```bash
npm run dev
```

Open http://localhost:3000 — the app is running! 🎉

---

## 🤖 AI / ML Architecture

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Land Classification | `facebook/bart-large-mnli` (HuggingFace) | Zero-shot land use classification |
| NDVI Computation | Physics-based geo simulation | Vegetation health index |
| Change Detection | Statistical time-series model | Deforestation & growth alerts |
| Spectral Analysis | Band math (NIR, Red, SWIR) | Reflectance computation |

### Why `facebook/bart-large-mnli`?
- **Zero-shot classification** — no labeled satellite training data needed
- **Semantic understanding** — classifies geographic regions intelligently
- **Free tier** — works with free Hugging Face API tokens
- **Fallback** — physics-based biome simulation if API is unavailable

---

## 🏗️ Project Structure

```
ecoscan-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts    ← Main AI analysis endpoint
│   │   │   └── health/route.ts     ← Health check
│   │   ├── page.tsx                ← Main page (all sections)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── HeroSection.tsx         ← Particle animation + stats
│   │   ├── FeaturesSection.tsx     ← 6 analysis capabilities
│   │   ├── AnalyzeSection.tsx      ← 🔥 Main interactive analysis
│   │   ├── TechnologySection.tsx   ← Architecture + how it works
│   │   ├── PricingSection.tsx      ← 3-tier pricing
│   │   ├── DocsSection.tsx         ← API code examples
│   │   └── Footer.tsx
│   ├── lib/
│   │   └── huggingface.ts          ← HF API integration + fallback
│   └── types/
│       └── index.ts                ← TypeScript interfaces
├── .env.local.example
├── package.json
└── README.md
```

---

## 🌍 Features

- **🌱 NDVI Analysis** — Vegetation health scoring (0.0–1.0)
- **🌲 Deforestation Detection** — Change detection with alerts
- **🏙️ Urban Growth Mapping** — Built-up area expansion tracking
- **💧 Water Body Detection** — River and lake monitoring
- **🌾 Agricultural Health** — Crop stress detection
- **🔥 Fire Detection** — Thermal anomaly alerts

---

## 📡 API Usage

```python
import requests

response = requests.post(
    "http://localhost:3000/api/analyze",
    json={
        "region": "Almaty Region, Kazakhstan",
        "analysisType": "vegetation",
        "timeRange": "30d",
        "satellite": "sentinel2"
    }
)

data = response.json()
print(f"NDVI: {data['ndvi']} — {data['ndviCategory']}")
print(f"Forest: {data['landUse']['forest']}%")
print(f"Alerts: {len(data['alerts'])}")
```

### Response Schema
```json
{
  "id": "analysis_1234567890_abc123",
  "region": "Almaty Region, Kazakhstan",
  "coordinates": { "lat": 43.22, "lon": 76.85 },
  "timestamp": "2025-01-15T10:30:00.000Z",
  "ndvi": 0.612,
  "ndviCategory": "Good",
  "landUse": {
    "forest": 28,
    "agriculture": 38,
    "urban": 18,
    "water": 9,
    "bare": 7
  },
  "changePercent": -3.2,
  "confidence": 96.4,
  "alerts": [
    {
      "type": "deforestation",
      "severity": "medium",
      "message": "3.2% vegetation loss detected vs previous period"
    }
  ],
  "modelInfo": {
    "name": "EcoScan U-Net v2.1",
    "source": "facebook/bart-large-mnli (HuggingFace)",
    "accuracy": 94.2
  }
}
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HUGGINGFACE_API_KEY` | HuggingFace API token | Yes (free) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, Custom CSS animations |
| AI/ML | Hugging Face Inference API |
| Data | ESA Copernicus Sentinel-2 (simulated) |
| Icons | Lucide React |

---

## 📊 Business Model

| Plan | Price | Target |
|------|-------|--------|
| Free | $0/mo | Developers, researchers |
| Pro | $199/mo | Teams, businesses |
| Enterprise | Custom | Government, large organizations |

**Market:** Global geospatial analytics market ($85B+ by 2030)  
**Competitors:** ESRI ArcGIS, Google Earth Engine  
**Advantage:** Simple API-first, affordable, AI-native

---

## 🤝 Team

Built for the Space AI Hackathon 2025.

---

*Built with ❤️ using Sentinel-2 open data and Hugging Face AI models*

---

## Backend v1 Upgrade (2026)

- Real satellite metadata integration via STAC Earth Search API (Sentinel-2 / Landsat / Sentinel-1 when available)
- Public versioned API:
  - `POST /api/v1/analyze`
  - `POST /api/v1/plan`
  - `GET /api/v1/health`
  - `GET/POST /api/v1/keys` (admin token required)
- Persistent DB layer for API keys and rate limits stored in `.data/ecoscan-db.json`
- Admin management header:
  - `x-admin-token: <ADMIN_API_TOKEN>`
