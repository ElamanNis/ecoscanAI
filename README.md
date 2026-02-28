# EcoScan AI - Satellite Earth Intelligence (Next.js + Supabase + Stripe)

EcoScan AI - production‑oriented web‑приложение для анализа любой точки на Земле:
карта/полигон → спутниковые сцены + погода/архив → индексы (NDVI/EVI/NDWI/…) → риск‑оценка → AI‑отчёт и рекомендации.

## Возможности

- Анализ региона (клик по карте / полигон) и выбор типа анализа/диапазона времени/спутника.
- Подробный результат: индексы, риск‑скоринг, breakdown факторов (засуха/жара/пожары/…), климат/вода, источники данных.
- История сканов (Supabase `scans_history`) и месячные лимиты по тарифу.
- Авторизация Supabase (login/register) + личный кабинет `/dashboard`.
- Оплата подписки Standard/Premium через Stripe Checkout + Stripe Webhook обновляет тариф в БД.
- Публичное API v1 (версионированные эндпоинты) + API keys/rate limit в Supabase.

---

## Технологии

- Frontend/SSR: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- Auth/DB: Supabase (RLS policies, triggers)
- Billing: Stripe (Checkout + Webhook + Billing Portal)
- AI: Groq (primary) + HuggingFace Inference (fallback via router)
- Deploy: Vercel

---

## Быстрый старт ( 1ЫЙ ВАРИАНТ- ВОИТИ НА НАШУ ГОТОВЫЙ САЙТ КОТОРЫЙ ДЕПЛОИЛСЯ ЧЕРЕP VERCEL)
https://ecoscanai.space/


2ЫЙ ВАРИАНТ -ЛОКАЛЬНО

### 0) Требования

- Node.js 20+
- npm 9+
- Supabase project (обязателен для auth/истории/тарифов)

### 1) Установка

```bash
npm install
cp .env.local.example .env.local
```

### 2) Настрой Supabase

1. Создай проект в Supabase.
2. Открой **SQL Editor** и выполни файл `supabase/SETUP.sql` целиком.
3. В Supabase → **Authentication** включи Email/Password (обычно включено по умолчанию).

Важно:
- `supabase/SETUP.sql` создаёт/чинит таблицы `profiles`, `scans_history`, `api_keys`, `rate_limits`.
- Включает RLS и политики доступа (профиль/сканы только для владельца).
- Добавляет trigger `handle_new_user()` (создаёт строку профиля) и не должен ломать signup.

### 3) Переменные окружения

Заполни `.env.local` (локально) и Environment Variables в Vercel (Production).

Минимум для запуска:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

AI (рекомендуется хотя бы один провайдер):

```bash
GROQ_API_KEY=...
# или
HUGGINGFACE_API_KEY=...
HF_ENDPOINT=https://router.huggingface.co
```

### 4) Запуск

```bash
npm run dev
```

Открой `http://localhost:3000`.

---

## Платежи Stripe (Standard/Premium)

### 1) Что нужно в Stripe

1. Создай продукты/цены (Prices) для Standard и Premium (recurring subscription).
2. Сохрани Price IDs.

### 2) Env vars (обязательно для billing)

```bash
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_PRICE_STANDARD=price_...
STRIPE_PRICE_PREMIUM=price_...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3) Webhook

Webhook endpoint:

```text
https://<your-domain>/api/billing/webhook
```

События, которые используются:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Проверка конфигурации:
- `GET /api/health` показывает `billing: configured/missing` для ключей.

---

## Архитектура и ключевые файлы

### UI

- `src/app/page.tsx` — лендинг (секции)
- `src/components/AnalyzeSection.tsx` - главный анализ, gating по авторизации
- `src/components/ResultsPanel.tsx` - отображение результата
- `src/components/PricingSection.tsx` - тарифы и кнопка Upgrade
- `src/components/AuthModal.tsx` - login/register модалка
- `src/app/dashboard/page.tsx`- кабинет/история/лимиты/кнопки оплаты

### API (internal)

- `GET src/app/api/me/route.ts` - tier/лимиты/usage за месяц (считает по `scans_history`)
- `POST src/app/api/analyze/route.ts` - расчёты + AI отчёт + запись в историю
- `POST src/app/api/chat/route.ts` - чат по результату
- `GET src/app/api/health/route.ts` - health + env диагностика

### Billing (Stripe)

- `POST src/app/api/billing/checkout/route.ts`
- `POST src/app/api/billing/portal/route.ts`
- `POST src/app/api/billing/webhook/route.ts`

### Supabase

- `supabase/SETUP.sql` - schema + RLS + trigger
- `src/lib/supabase/server.ts` - server client (cookies)
- `src/lib/supabase/admin.ts` - admin client (service role, для webhook)
- `middleware.ts` - sync Supabase cookies/session для App Router

---

## Данные и лимиты

- Месячный счётчик анализов считается по таблице `public.scans_history` за текущий месяц.
- Тариф хранится в `public.profiles.subscription_tier` и обновляется Stripe webhook‑ом.

---

## Публичное API v1 (для внешних клиентов)

- `POST /api/v1/analyze`
- `POST /api/v1/plan`
- `GET /api/v1/health`
- `POST /api/v1/keys` (требует `ADMIN_API_TOKEN`)

---

## Troubleshooting

### Signup возвращает `500` (Supabase `Database error saving new user`)

Почти всегда причина - DB trigger/таблица `profiles`/политики.

Что делать:
1. Выполни `supabase/SETUP.sql` целиком ещё раз (он safe‑to‑rerun).
2. Посмотри Supabase → **Logs → Auth** (там будет точная причина).

### `AuthApiError: Invalid Refresh Token`

Это битая/устаревшая сессия в браузере.

Что делать:
- DevTools → Application → Cookies/Local storage/Session storage для домена → удалить `sb-...` ключи и cookies → hard refresh.

### Upgrade/Checkout падает

1. Открой Network → `/api/billing/checkout` → Response (в ответе есть `details.message` от Stripe).
2. Проверь, что `STRIPE_SECRET_KEY` и `STRIPE_PRICE_*` из одной среды (test vs live).

---

## Деплой (Vercel)

1. Задай Environment Variables (Production).
2. Деплой:

```bash
vercel --prod
```

3. Проверь:
- `GET /api/health`
- регистрацию/вход
- запуск анализа
- Upgrade (Stripe Checkout) + webhook обновление тарифа
