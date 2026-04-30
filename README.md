# TARA
Interactive birthday web app where friends can upload messages, photos, and memories in real time.”
# CMS Upgrade (React + Node)

## Current Architecture

- `frontend/`: Vite + React app with API-driven rendering
  - Public site: `/`
  - Admin dashboard: `/admin`
  - Preview route: `/preview/:id`
- `backend/`: Express + MongoDB API
  - Monolithic site-content endpoint for existing app shape
  - CMS content-item REST API with moderation workflow
  - Media upload signing endpoint for Cloudinary direct upload

## CMS Data Model

`content item`

- `id`
- `type`: `message | image | story | event | music | section`
- `title`
- `data` (JSON payload)
- `status`: `draft | pending | published | rejected`
- `createdByRole`: `admin | user`
- `createdBy`
- `createdAt`
- `previewEnabled`

## API Endpoints

### Public

- `GET /api/public/site-content`
- `GET /api/public/preview/:id`

### Auth

- `POST /api/auth/login`

### Admin Site-Content

- `GET /api/admin/site-content`
- `PUT /api/admin/site-content`

### CMS Content (Hybrid Moderation)

- `GET /api/content`
- `POST /api/content`
  - Admin creates `draft/published`
  - Public/user creates `pending`
- `PATCH /api/content/:id` (admin)
- `DELETE /api/content/:id` (admin)
- `PATCH /api/content/:id/approve` (admin)
- `PATCH /api/content/:id/reject` (admin)

### Media (Cloudinary)

- `POST /api/admin/media/signature` (admin)

## Frontend Standards Added

- API-only content fetch (no static fallback)
- `@tanstack/react-query` for data fetching and hydration
- Explicit loading and error states in `App`
- Base typography token system in `src/index.css`

## Storybook

From `frontend/`:

```bash
npm run storybook
```

Build Storybook:

```bash
npm run build-storybook
```

## Backend Testing

From `backend/`:

```bash
npm test
```

Current tests:

- health route (`/api/health`)
- moderation status transition rules

## Environment Setup

### Frontend (`frontend/.env`)

- `VITE_API_URL=http://localhost:5000`

### Backend (`backend/.env`)

- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `CORS_ORIGIN`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Default local admin login (single credential):

- Username: `adesa`
- Password: `Adesa@26022002`

## Local Run

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Notes

- Legacy static files remain untouched at project root for reference.
- For production, deploy frontend on Vercel and backend on Render/Railway.
- Use Cloudinary direct upload from admin using signed payload from backend.
