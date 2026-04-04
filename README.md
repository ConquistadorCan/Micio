# Micio

Real-time chat application with 1-1 and group conversations.

## Stack

- **Frontend:** React 19, TypeScript, Vite
- **Backend:** Node.js, TypeScript
- **Monorepo:** npm workspaces

## Getting Started

```bash
npm install
npm run dev          # starts both frontend and backend
npm run dev:frontend # frontend only
npm run dev:backend  # backend only
```

## Structure

```
apps/
  frontend/   # React app
  backend/    # Node.js API + WebSocket server
packages/
  shared/     # Shared types and utilities
```

## API

REST endpoints under `/auth` and `/conversations`, real-time messaging via WebSocket (`message:send`, `conversation:join`, `conversation:leave`).
