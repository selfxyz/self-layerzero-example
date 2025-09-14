# Self Workshop (Frontend)

Next.js UI for verifying with the Self mobile app and tracking LayerZero delivery.

## Prerequisites

- Node.js 20.x
- npm
- Self App: [iOS](https://apps.apple.com/us/app/self-zk/id6478563710) or [Android](https://play.google.com/store/apps/details?id=com.proofofpassportapp)

## Environment

Copy and edit env:
```bash
cp .env.example .env
```

Set variables:
- `NEXT_PUBLIC_SOURCE_CONTRACT`: Celo Mainnet source contract address
- `NEXT_PUBLIC_SELF_APP_NAME` and `NEXT_PUBLIC_SELF_SCOPE`: UI labels
- `NEXT_PUBLIC_SOURCE_EXPLORER`, `NEXT_PUBLIC_DEST_EXPLORER`: Explorer base URLs
- `SOURCE_RPC`, `DEST_RPC` (server-only): RPCs used by `/api/status`

## Run

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## Flow

- Homepage shows a QR and a Connect Wallet button (no manual address input). The connected address is used as `userId`.
- On success, the app navigates to `/status?user=<address>` which polls recent sends (Celo) and receipts (Base).
- “Copy/Open” buttons are shown only on mobile/in-app browsers.

## Customize

- `app/app/page.tsx`: UI for QR, address input, and building the Self app.
- `app/app/status/page.tsx`: Status page polling logic.
- `app/app/api/status/route.ts`: Server route that fetches recent events (never 500s; returns `warnings` instead).

## Notes

- The server uses `SOURCE_RPC`/`DEST_RPC`. Do not prefix them with `NEXT_PUBLIC`.
- Use Node 20.x.
