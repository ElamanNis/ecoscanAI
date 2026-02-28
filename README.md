# EcoScan AI — Satellite Earth Intelligence (Next.js + Supabase + Stripe)

EcoScan AI — production‑oriented web‑приложение для анализа любой точки на Земле:
карта/полигон → спутниковые сцены + погода/архив → индексы (NDVI/EVI/NDWI/…) → риск‑оценка → AI‑отчёт и рекомендации → история + лимиты → подписки (Stripe).

Этот README — техническая документация по продукту:
- архитектура решения и стек,
- используемые алгоритмы/модели ИИ,
- руководство по запуску и демонстрации.

---

## 1) Возможности продукта (5 ключевых)

- **Анализ региона**: клик по карте или рисование полигона, выбор типа анализа/временного диапазона/спутника.
- **Отчёт**: индексы, риск‑скоринг, breakdown факторов (засуха/жара/пожары/…), климат/вода, источники данных.
- **AI‑вывод**: insights + recommendations + advisory (агро/вода/климат), чат по результатам.
- **История и лимиты**: сканы сохраняются в Supabase `scans_history`, лимит считается по текущему месяцу.
- **Подписки**: тарифы Free/Standard/Premium, Upgrade через Stripe Checkout, тариф синхронизируется webhook‑ом.

---

## 2) Архитектура решения

### High-level (поток данных)

1. **UI (Next.js)** получает ввод пользователя (регион/координаты/полигон).
2. UI вызывает **API** (`/api/analyze`, `/api/v1/plan`, `/api/chat`).
3. API собирает данные из внешних источников (погода/архив/спутник/высота/геокодинг).
4. API считает индексы и формирует structured JSON.
5. **LLM слой** (Groq/HF) превращает результаты в понятный отчёт/план.
6. API сохраняет результат в Supabase `scans_history`.
7. UI отображает результат (`ResultsPanel`), лимиты берёт из `/api/me`.

### Компоненты

- **Next.js App Router**
  - UI: `src/app/page.tsx`, компоненты в `src/components/*`
  - API: `src/app/api/*` и `src/app/api/v1/*`
- **Supabase**
  - Auth: email/password
  - DB: `profiles`, `scans_history`, `api_keys`, `rate_limits`
  - RLS: политики “только владелец” для профиля/истории
  - Trigger: автосоздание `profiles` на signup (и не должен ломать signup)
- **Stripe**
  - Checkout (subscription mode)
  - Billing portal
  - Webhook обновляет `profiles.subscription_tier`

---

## 3) Технологический стек

- **Frontend/SSR**: Next.js 14 (App Router), React 18, TypeScript
- **UI**: Tailwind CSS + кастомные эффекты/анимации
- **Map**: Leaflet (client-only)
- **Auth/DB**: Supabase + RLS + triggers
- **Billing**: Stripe (`stripe` SDK)
- **AI**:
  - Groq (primary, если задан `GROQ_API_KEY`)
  - HuggingFace Inference (fallback, `HUGGINGFACE_API_KEY`, `HF_ENDPOINT=https://router.huggingface.co`)
- **Deploy**: Vercel

---

## 4) Алгоритмы и модели ИИ (что именно делает “AI”)

### 4.1 Индексы и численные вычисления (детерминированно)

На стороне сервера рассчитываются (упрощённо, в терминах продукта):
- NDVI / EVI / SAVI / NDWI и дополнительные derived‑показатели
- risk scoring (overall + factors), clamping/normalization
- confidence оценка на основе успеха источников данных

Важное свойство: индексы/риски → **структурированный JSON**, который можно хранить, повторять и валидировать.

### 4.2 LLM слой (Groq/HF)

LLM используется для:
- **headline/summary** (“что происходит в регионе”)
- **insights** (наблюдения по индексу/рискам/трендам)
- **recommendations** (список действий с приоритетом/категорией/таймфреймом)
- **advisory** (агро/вода/климат: что делать)
- **action plan** (план на 3/6/12 месяцев)
- **chat** (ответы на вопросы по результату)

LLM НЕ является источником истины для индексов. Индексы/данные считаются/собираются кодом, LLM — “объясняет и структурирует”.

### 4.3 Нормализация/валидация AI ответов

В серверном коде AI‑ответ:
- парсится как JSON,
- нормализуется (типы/поля),
- если AI не вернул валидный ответ — используется fallback.

---

## 5) Структура проекта (важные файлы)

### UI
- `src/components/AnalyzeSection.tsx` — основной UI анализа, gating по авторизации
- `src/components/MapComponent.tsx` — карта (click/draw), выдаёт координаты/полигон
- `src/components/ResultsPanel.tsx` — отображение результата анализа
- `src/components/AuthModal.tsx` — login/register модалка на лендинге
- `src/components/PricingSection.tsx` — тарифы и Upgrade
- `src/app/dashboard/page.tsx` — кабинет: профиль/usage/история/billing

### API (internal)
- `GET src/app/api/me/route.ts` — user/tier/лимиты/usage за месяц (по `scans_history`)
- `POST src/app/api/analyze/route.ts` — анализ + сохранение в историю
- `POST src/app/api/chat/route.ts` — чат
- `GET src/app/api/health/route.ts` — health + диагностика env

### Billing (Stripe)
- `POST src/app/api/billing/checkout/route.ts` — Stripe Checkout Session (subscription)
- `POST src/app/api/billing/portal/route.ts` — Billing Portal
- `POST src/app/api/billing/webhook/route.ts` — webhook → обновляет тариф в `profiles`

### Supabase
- `supabase/SETUP.sql` — schema + RLS + trigger (safe-to-rerun)
- `src/lib/supabase/server.ts` — server client (cookies)
- `src/lib/supabase/admin.ts` — admin client (service role, webhook)
- `middleware.ts` — sync session cookies для App Router

---

## 6) Подготовка окружения (локально)

### 6.1 Требования

- Node.js 20+
- npm 9+
- Supabase project (обязателен для auth/истории/лимитов/подписок)

### 6.2 Установка

```bash
npm install
cp .env.local.example .env.local
```

### 6.3 Supabase setup

1) Создай проект в Supabase  
2) Открой **SQL Editor** → выполни `supabase/SETUP.sql` целиком  
3) Supabase → **Authentication** → включи Email/Password (обычно включено)  

---

## 7) Переменные окружения

Заполни `.env.local` (локально) и Environment Variables в Vercel (Production).

### 7.1 Минимум для запуска UI+Auth

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 7.2 AI (выбери хотя бы один провайдер)

```bash
GROQ_API_KEY=...
# или
HUGGINGFACE_API_KEY=...
HF_ENDPOINT=https://router.huggingface.co
```

### 7.3 Stripe (billing)

```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_PREMIUM=price_...
SUPABASE_SERVICE_ROLE_KEY=...
```

Примечания:
- `SUPABASE_SERVICE_ROLE_KEY` нужен серверу (webhook/DB‑операции без RLS).
- `STRIPE_SECRET_KEY` и `STRIPE_PRICE_*` должны быть из одной среды (test vs live).

---

## 8) Запуск / демонстрация продукта (Demo Guide)

### 8.1 Локально

```bash
npm run dev
```

Открой `http://localhost:3000`.

Демо‑сценарий:
1) На лендинге нажми Analyze.
2) Зарегистрируйся/войти (Supabase Auth).
3) Выбери Click mode и кликни на карте (или Draw mode → 3+ точки → double‑click закрыть).
4) Нажми “Analyze”.
5) Открой вкладки Results / AI / Spectral / Plan.
6) В Pricing нажми Upgrade (если Stripe настроен).

### 8.2 Production (Vercel)

В production проверь:
- `GET /api/health` — должны быть `configured` для нужных ключей
- регистрация/вход
- анализ и сохранение в `scans_history`
- Upgrade → Stripe Checkout → webhook обновляет tier

---

## 9) API (кратко)

### Internal
- `GET /api/me`
- `POST /api/analyze`
- `POST /api/chat`
- `GET /api/health`

### Public v1
- `POST /api/v1/analyze`
- `POST /api/v1/plan`
- `GET /api/v1/health`
- `POST /api/v1/keys` (нужен `ADMIN_API_TOKEN`)

---

## 10) Модель данных (Supabase)

### `public.profiles`
- `id` (uuid, FK → `auth.users.id`)
- `full_name`
- `subscription_tier`: `free | standard | premium`
- `stripe_customer_id`, `stripe_subscription_id`

### `public.scans_history`
- `id` (uuid)
- `user_id` (uuid, FK → `auth.users.id`)
- `created_at`
- `region`, `analysis_type`, `ndvi`, `ndvi_category`
- `payload` (jsonb, полный результат)

### Лимиты
- usage за месяц считается количеством строк в `scans_history` за текущий месяц.

---

## 11) Troubleshooting (частые проблемы)

### Signup возвращает `500` (Supabase `Database error saving new user`)

Почти всегда причина — DB trigger/таблица `profiles`/дубли policies.

Что делать:
1) Выполни `supabase/SETUP.sql` целиком ещё раз (он safe‑to‑rerun).  
2) Supabase → **Logs → Auth**: открой запись на момент signup — там будет первопричина.

### `AuthApiError: Invalid Refresh Token`

Это битая/устаревшая сессия в браузере.

Что делать:
- DevTools → Application → Cookies/Local storage/Session storage для домена → удалить `sb-...` ключи и cookies → hard refresh.

### Upgrade/Checkout падает

1) Открой Network → `/api/billing/checkout` → Response (есть `details.message` от Stripe).  
2) Проверь env: `STRIPE_SECRET_KEY`, `STRIPE_PRICE_*`, `STRIPE_WEBHOOK_SECRET`.  

---

## 12) Деплой (Vercel)

1) Задай Environment Variables (Production).  
2) Деплой:

```bash
vercel --prod
```

3) Smoke‑check:
- `GET /api/health`
- регистрация/вход
- запуск анализа
- `/dashboard` показывает tier/лимиты
- Upgrade (Stripe Checkout) + webhook обновление тарифа
