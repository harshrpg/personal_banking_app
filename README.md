# Open Banking Personal Dashboard

Production-ready, single-user Open Banking dashboard built with Next.js App Router, Bun, TypeScript, TailwindCSS, and shadcn/ui. Connect up to three bank accounts with GoCardless Bank Account Data and view balances, transactions, and insights.

## Tech Stack

- Next.js App Router + React 19
- Bun runtime + tooling
- TailwindCSS v4 + shadcn/ui
- Vercel KV for persistence

## Local Development (Bun)

```bash
bun install
bun dev
```

Open `http://localhost:3000`.

## Required Environment Variables

Set these in `.env.local` (and in Vercel project settings):

```
GC_SECRET_ID=your_gocardless_secret_id
GC_SECRET_KEY=your_gocardless_secret_key
APP_URL=http://localhost:3000
APP_API_KEY=your_personal_key
NEXT_PUBLIC_DEBUG=true
REDIS_URL=redis://default:password@host:port
```

Notes:
- `APP_API_KEY` is used only server-side for internal API protection.
- `NEXT_PUBLIC_DEBUG` controls the API Health widget (optional).

## Vercel Deployment Notes

1. Provision a Redis instance and set `REDIS_URL` in Vercel project settings.
2. Configure the remaining env vars in Vercel project settings.
3. Set `APP_URL` to your Vercel deployment URL (e.g., `https://your-app.vercel.app`).
4. Deploy with the Vercel UI or CLI (`vercel`).

## How to Use

1. Visit `/connect` and click **Initialize token** once (creates refresh token).
2. Choose country (IE/GB), search for your institution, and click **Connect**.
3. Complete the GoCardless auth flow and return to the app.
4. Visit `/dashboard` to see balances, transactions, and insights.
5. Use `/accounts` to rename, resync, or disconnect accounts.
6. Adjust access settings under `/settings`.

## Security Notes

- All GoCardless calls are handled in server route handlers only.
- Routes are protected with `X-APP-KEY` headers on server-to-server requests.
- Secrets never reach the browser.
