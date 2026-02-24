"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Lang = "ru" | "en" | "kz";

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof DICT.en) => string;
};

const DICT = {
  en: {
    navDashboard: "Dashboard",
    navAnalyze: "Analyze",
    navReports: "Reports",
    navPricing: "Pricing",
    navDocs: "Docs",
    navGetApi: "Get API Key",
    menu: "MENU",
    close: "CLOSE",

    heroBadge: "5 Real APIs · Multi-AI · Real Satellite Data",
    heroTitle1: "Satellite Intelligence",
    heroTitle2: "At Your Fingertips",
    heroText:
      "Click any point on Earth and get a full environmental report with live climate, satellite scenes, risks, crop recommendations, and AI interpretation.",
    heroCtaAnalyze: "Analyze Any Point on Earth",
    heroCtaDemo: "View API Demo",
    statHa: "ha analyzed today",
    statSources: "real data sources",
    statAccuracy: "model accuracy",
    statLatency: "avg response",

    analyzeBadge: "Live analysis",
    analyzeTitle: "Analyze Any Region On Earth",
    analyzeText:
      "Choose a point on the map or draw a polygon. The platform fetches real climate and satellite metadata and returns a full AI report.",
    clickMode: "Click mode",
    drawMode: "Draw mode",
    regionLabel: "Region or coordinates",
    analysisType: "Analysis type",
    timeRange: "Time range",
    satelliteSource: "Satellite source",
    goalLabel: "Goal for AI advisory",
    goalPlaceholder: "Example: optimize irrigation and reduce heat stress",
    runAnalysis: "Run Analysis",
    runningAnalysis: "Running analysis...",
    stepFetch: "Fetching API data",
    stepCompute: "Computing indices",
    stepAi: "Running AI",
    stepFinal: "Finalizing report",
    tabResults: "Results",
    tabAi: "AI Chat",
    tabSpectral: "Spectral",
    tabPlan: "Plan",
    emptyResults: "Run analysis to see full multi-factor report.",
    noSpectral: "No spectral data yet.",
    actionPlan: "Action plan generator",
    generatePlan: "Generate Plan",
    generating: "Generating...",

    featuresTitle: "Built for Farmers, Scientists, and Policy Teams",
    technologyTitle: "Real Data Pipeline",
    pricingTitle: "Plans",
    docsTitle: "Developer Quickstart",
    wowTitle: "Global Monitoring Feed",
    footerTagline: "Analyze Earth changes in seconds with AI",
    footerBuilt: "Built with Sentinel-2 open data | Powered by AI",
  },
  ru: {
    navDashboard: "Панель",
    navAnalyze: "Анализ",
    navReports: "Отчеты",
    navPricing: "Тарифы",
    navDocs: "Документация",
    navGetApi: "Получить API ключ",
    menu: "МЕНЮ",
    close: "ЗАКРЫТЬ",

    heroBadge: "5 реальных API · Мульти‑ИИ · Реальные спутниковые данные",
    heroTitle1: "Спутниковая аналитика",
    heroTitle2: "Под вашими пальцами",
    heroText:
      "Выберите любую точку на Земле и получите полный экологический отчет: климат, спутниковые сцены, риски, рекомендации по урожаю и AI-интерпретацию.",
    heroCtaAnalyze: "Анализировать точку на Земле",
    heroCtaDemo: "Смотреть API демо",
    statHa: "га проанализировано сегодня",
    statSources: "реальных источников данных",
    statAccuracy: "точность модели",
    statLatency: "средний ответ",

    analyzeBadge: "Живой анализ",
    analyzeTitle: "Анализируйте любой регион Земли",
    analyzeText:
      "Выберите точку на карте или нарисуйте полигон. Платформа загрузит реальные климатические и спутниковые данные и вернет полный AI-отчет.",
    clickMode: "Режим клика",
    drawMode: "Режим рисования",
    regionLabel: "Регион или координаты",
    analysisType: "Тип анализа",
    timeRange: "Период",
    satelliteSource: "Спутник",
    goalLabel: "Цель для AI-рекомендаций",
    goalPlaceholder: "Пример: оптимизировать полив и снизить тепловой стресс",
    runAnalysis: "Запустить анализ",
    runningAnalysis: "Идет анализ...",
    stepFetch: "Загрузка данных API",
    stepCompute: "Расчет индексов",
    stepAi: "Работа ИИ",
    stepFinal: "Формирование отчета",
    tabResults: "Результаты",
    tabAi: "AI Чат",
    tabSpectral: "Спектр",
    tabPlan: "План",
    emptyResults: "Запустите анализ, чтобы увидеть полный отчет.",
    noSpectral: "Спектральных данных пока нет.",
    actionPlan: "Генератор плана действий",
    generatePlan: "Сгенерировать план",
    generating: "Генерация...",

    featuresTitle: "Для фермеров, ученых и госкоманд",
    technologyTitle: "Пайплайн реальных данных",
    pricingTitle: "Тарифы",
    docsTitle: "Быстрый старт для разработчиков",
    wowTitle: "Глобальная лента мониторинга",
    footerTagline: "Анализ изменений Земли за секунды с ИИ",
    footerBuilt: "Построено на данных Sentinel-2 | Усилено ИИ",
  },
  kz: {
    navDashboard: "Панель",
    navAnalyze: "Талдау",
    navReports: "Есептер",
    navPricing: "Бағалар",
    navDocs: "Құжаттама",
    navGetApi: "API кілтін алу",
    menu: "МӘЗІР",
    close: "ЖАБУ",

    heroBadge: "5 нақты API · Multi‑AI · Нақты спутник деректері",
    heroTitle1: "Спутниктік интеллект",
    heroTitle2: "Қолыңыздың ұшында",
    heroText:
      "Жердің кез келген нүктесін таңдаңыз және толық экологиялық есеп алыңыз: климат, спутник кадрлары, тәуекелдер, егінге кеңес және AI түсіндірме.",
    heroCtaAnalyze: "Жер нүктесін талдау",
    heroCtaDemo: "API демон қарау",
    statHa: "бүгін талданған га",
    statSources: "нақты дерек көзі",
    statAccuracy: "модель дәлдігі",
    statLatency: "орташа жауап",

    analyzeBadge: "Тікелей талдау",
    analyzeTitle: "Жердің кез келген аймағын талдаңыз",
    analyzeText:
      "Картадан нүкте таңдаңыз немесе полигон сызыңыз. Платформа нақты климат және спутник метадеректерін алып, толық AI есеп береді.",
    clickMode: "Басу режимі",
    drawMode: "Сызу режимі",
    regionLabel: "Аймақ немесе координат",
    analysisType: "Талдау түрі",
    timeRange: "Уақыт аралығы",
    satelliteSource: "Спутник көзі",
    goalLabel: "AI кеңес мақсаты",
    goalPlaceholder: "Мысалы: суаруды оңтайландыру және ыстық стрессін азайту",
    runAnalysis: "Талдауды бастау",
    runningAnalysis: "Талдау жүріп жатыр...",
    stepFetch: "API деректерін алу",
    stepCompute: "Индекстерді есептеу",
    stepAi: "AI өңдеу",
    stepFinal: "Есепті аяқтау",
    tabResults: "Нәтижелер",
    tabAi: "AI Чат",
    tabSpectral: "Спектр",
    tabPlan: "Жоспар",
    emptyResults: "Толық есепті көру үшін талдау іске қосыңыз.",
    noSpectral: "Әзірге спектр дерегі жоқ.",
    actionPlan: "Іс-қимыл жоспарын жасау",
    generatePlan: "Жоспар құру",
    generating: "Құрылуда...",

    featuresTitle: "Фермерлер, ғалымдар және саясат топтары үшін",
    technologyTitle: "Нақты деректер құбыры",
    pricingTitle: "Тарифтер",
    docsTitle: "Әзірлеушіге жылдам бастау",
    wowTitle: "Ғаламдық мониторинг лентасы",
    footerTagline: "AI арқылы Жер өзгерістерін секундтарда талдау",
    footerBuilt: "Sentinel-2 ашық деректерімен жасалған | AI қуаттайды",
  },
} as const;

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("ru");

  useEffect(() => {
    const saved = localStorage.getItem("ecoscan_lang") as Lang | null;
    if (saved === "ru" || saved === "en" || saved === "kz") setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("ecoscan_lang", lang);
  }, [lang]);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key) => DICT[lang][key],
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

