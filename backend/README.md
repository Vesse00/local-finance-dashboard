# Local Finance Dashboard Backend (NestJS)

Backend API extracted to a dedicated NestJS service.

## Default runtime settings

- Port: 4000
- Global prefix: /api
- CORS origin: [http://localhost:3003](http://localhost:3003)

All settings can be changed with environment variables:

- PORT
- CORS_ORIGIN
- INTERNAL_API_SECRET

In the frontend/root app set:

- BACKEND_URL=http://localhost:4000/api
- INTERNAL_API_SECRET=<the same value as backend>

## Run backend directly

From this directory:

```bash
npm install
npm run start:dev
```

## Run from project root

From root directory:

```bash
npm run dev:backend
```

Run frontend + backend together:

```bash
npm run dev:all
```

## Build

Backend only:

```bash
npm run build
```

From root (frontend + backend):

```bash
npm run build:all
```
