# Arka AI

Arka AI is a collaborative AI workspace for software architecture planning. It combines a realtime canvas, AI chat, autosave, access control, and spec generation into one product so teams can move from rough ideas to structured technical specs without switching tools.

## What problem it solves

Product and engineering teams often split architecture work across whiteboards, chat apps, docs, and task tools. That creates context switching, duplicated notes, and inconsistent specs. Arka AI brings those workflows together in one shared space so teams can:

1. Design system diagrams visually in a realtime canvas
2. Discuss architecture with an AI assistant in context
3. Generate structured Markdown specs from the canvas and chat
4. Save and download specs for future reference
5. Collaborate with teammates through auth and room-based access control

## Tech Stack

Frontend:

1. React 19
2. Vite 8
3. Tailwind CSS 4
4. Clerk React
5. Liveblocks React
6. React Flow / XYFlow
7. Trigger.dev React Hooks
8. shadcn-style UI primitives

Backend:

1. FastAPI
2. Beanie
3. MongoDB
4. Motor
5. Clerk backend auth
6. Liveblocks REST API
7. Trigger.dev API

AI and storage:

1. Groq SDK
2. Trigger.dev background tasks
3. Vercel Blob for spec and canvas persistence

## Key Features

1. Realtime collaborative workspace with room-based presence
2. AI Architect chat for brainstorming and design assistance
3. Automatic architecture spec generation from chat and canvas context
4. Spec preview and Markdown download
5. Canvas autosave and restore
6. Project sharing with collaborator access control

## Architecture Overview

The app uses a React frontend with a FastAPI backend. Clerk handles authentication, Liveblocks handles room sync and presence, Trigger.dev runs background AI jobs, and MongoDB stores project data and run tracking. Groq powers the text generation layer for AI-assisted design and spec creation.

## Getting Started

### Prerequisites

1. Node.js 18+
2. Python 3.10+
3. MongoDB Atlas connection string
4. Clerk frontend and backend keys
5. Liveblocks secret key
6. Trigger.dev secret key
7. Groq API key

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv .venv
python -m pip install -r requirements.txt
python main.py
```

## Environment Variables

Frontend:

1. `VITE_CLERK_PUBLISHABLE_KEY`

Backend:

1. `CLERK_ISSUER`
2. `MONGODB_URI`
3. `MONGODB_DB`
4. `LIVEBLOCKS_SECRET_KEY`
5. `TRIGGER_SECRET_KEY`
6. `GROQ_API_KEY`

## Project Scope

This repository includes:

1. A collaborative editor shell
2. AI-assisted architecture chat
3. Spec generation and preview
4. Canvas persistence and autosave
5. Backend APIs for projects, sharing, and AI workflows

## Status

Arka AI is a working full-stack product focused on collaborative architecture planning and AI-generated technical specifications.
