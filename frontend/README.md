 # WikiSourceVerifier Frontend

The WikiSourceVerifier frontend is a React single-page application for discovering, submitting, and verifying credible Wikipedia references by country. It provides public browsing, authentication, contributor workflows, country pages, verifier queues, and administration tools.

## Technology

- React 18 with TypeScript
- Vite 6
- React Router
- Tailwind CSS
- Radix UI primitives in `src/components/ui`
- React Hook Form, Recharts, Lucide React, and Sonner
- Wikidata services for country-related information

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer
- A running WikiSourceVerifier backend for API-backed features

See [`backend/README.md`](../backend/README.md) for backend and database setup.

## Getting started

```bash
cd frontend
npm install
npm run dev
```

Vite runs at `http://localhost:3000` and proxies `/api` requests to `http://localhost:5000`. Start the backend separately:

```bash
cd backend
npm run dev
```

## Environment configuration

Create `frontend/.env.local` if the API is hosted elsewhere:

```env
VITE_API_URL=http://localhost:5000/api
```

Without this variable, the API client uses `/api`, which is suitable for the Vite proxy and same-origin production deployments. Only `VITE_*` variables are exposed to browser code; never put passwords, JWT secrets, or database credentials in them.

## Scripts

```bash
npm run dev       # Start the development server
npm run build     # Create the production bundle in dist/
npm run preview   # Preview the production bundle locally
```

There is currently no frontend test or lint script. Run `npm run build` before submitting changes.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/auth` | Login and registration |
| `/directory` | Public reference directory |
| `/country/:countryCode` | Country sources and statistics |
| `/submit` | Submit a reference for verification |
| `/profile` | User dashboard and profile |
| `/admin` | Verification and administration dashboard |
| `*` | Not-found page |

Routes are registered in [`src/App.tsx`](src/App.tsx). Page exports are collected in [`src/pages/index.ts`](src/pages/index.ts).

## Project structure

```text
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Shared app components and UI primitives
│   ├── guidelines/         # Design and project guidance
│   ├── lib/                # API, auth, mock data, and Wikidata services
│   ├── pages/              # Route-level components
│   ├── App.tsx             # Providers, navigation, routes, and footer
│   ├── index.css           # Tailwind entry point and global styles
│   └── main.tsx            # React root and BrowserRouter
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

When adding a page, create it under `src/pages`, export it from `src/pages/index.ts`, register its route in `src/App.tsx`, and use existing components from `src/components/ui` where possible.

## Backend integration

[`src/lib/api.ts`](src/lib/api.ts) contains the shared API client and endpoint helpers:

- `authApi`: registration, login, logout, refresh, profile, and password operations
- `submissionApi`: create, list, update, delete, statistics, and verification operations
- `userApi`: profiles, leaderboards, badges, roles, and account activation

Requests send JSON headers, include credentials, attach the access token as a Bearer token, retry once after a `401` using the refresh token, and normalize common network errors. Backend resources are mounted under `/api`, including `/auth`, `/submissions`, `/users`, `/countries`, `/admin`, `/reports`, and `/system`.

Keep API calls in `src/lib/api.ts` instead of scattering raw `fetch` calls through page components.

## Authentication

`AuthProvider` wraps the app and exposes the `useAuth` hook:

```tsx
const { user, loading, login, logout, register, updateUser } = useAuth();
```

Users have `contributor`, `verifier`, or `admin` roles. On startup, the provider calls `/auth/me` when an access token exists. The client stores `accessToken` and `refreshToken` in `localStorage` and clears them when authentication fails.

Authenticated pages should handle `loading` and unauthenticated states explicitly. Role authorization must also be enforced by the backend; frontend checks are only a user-experience layer.

## Local data behavior

`AppContent` calls `initializeData()` on mount. `src/lib/mock-data.ts` can seed submission and user data in `localStorage` for UI development, while API-backed operations use the backend as their source of truth. If stale local data causes confusion, clear site data for `localhost:3000` in the browser.

Country metadata is retrieved through Wikidata helpers and may be affected by network availability or CORS policies.

## Production deployment

```bash
npm run build
npm run preview
```

The production output is `frontend/dist`. Configure the web server to serve `index.html` as the fallback for client-side routes such as `/directory` and `/country/NG`. The deployed app must reach the backend through `VITE_API_URL`, or both frontend and backend must share an origin.

## Troubleshooting

### API requests fail

Confirm the backend is on port `5000`, the frontend is on port `3000`, and requests use `/api`. For another backend port, update the proxy in `vite.config.ts` or set `VITE_API_URL`.

### Authentication fails after a restart

Tokens may be expired or invalid. Log in again, or remove `accessToken` and `refreshToken` from local storage.

### Direct navigation returns a 404

Configure the production server to return `index.html` for unknown frontend paths so React Router can handle them.

### Dependency changes break the build

From `frontend/`, reinstall from the lockfile and rebuild:

```bash
rm -rf node_modules
npm ci
npm run build
```

## Contributing

- Keep route-level behavior in `src/pages` and reusable behavior in `src/components` or `src/lib`.
- Prefer existing UI primitives and Tailwind conventions.
- Handle loading, empty, error, and unauthenticated states for API-backed views.
- Never expose secrets through `VITE_*` variables.
- Run `npm run build` before submitting changes.

The frontend is licensed under the terms of the repository's project license.
