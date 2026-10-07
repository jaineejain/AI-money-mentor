# AI Money Mentor

AI Money Mentor is a React/Vite personal finance dashboard with an Express,
MongoDB-ready backend and Gemini-powered advisor endpoints.

## Project Structure

```text
frontend/   React and Vite client (existing UI preserved)
backend/     Express API, validation, AI service, and Mongoose schemas
```

The existing `frontend/` directory is retained as the client application so
component paths, Tailwind classes, styling, and user flows remain unchanged.

## Requirements

- Node.js 20 or newer
- npm
- MongoDB, only when persistence is required
- A Google Gemini API key for AI endpoints

## Configuration

Create `backend/.env` from `backend/.env.example`:

```env
PORT=8000
GEMINI_API_KEY=your-gemini-api-key
GEMINI_EMBEDDING_MODEL=text-embedding-004
# Optional MongoDB Atlas Search index name for KnowledgeChunk.embedding
KNOWLEDGE_VECTOR_INDEX=knowledge_vector_index
MONGODB_URI=mongodb://127.0.0.1:27017/ai-money-mentor
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Create `frontend/.env` from `frontend/.env.example` when the API is not using
the default URL:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Never commit either `.env` file.

## Installation and Running

Install and start the API:

```bash
cd backend
npm install
npm run dev
```

Knowledge ingestion is explicit and does not run during server startup:

```bash
cd backend
npm run ingest:knowledge
```

The command loads the reviewed source metadata in `backend/knowledge`, chunks
the documents, reuses embeddings for unchanged versions, and stores chunks in
MongoDB. Configure `KNOWLEDGE_VECTOR_INDEX` only when the MongoDB deployment
has a compatible Atlas Vector Search index; otherwise the service uses stored
embeddings with a bounded lexical fallback.

Install and start the client in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The client is normally available at `http://localhost:5173`.

## API Contract

The Express backend preserves the existing paths and JSON contracts:

- `GET /health`
- `POST /api/chat`
- `POST /api/advice`
- `POST /api/score`
- `POST /api/fire-plan`
- `GET /api/dashboard` (authenticated; includes daily snapshots)
- `GET /api/snapshots` and `POST /api/snapshots` (authenticated)
- `POST /api/knowledge/query` (authenticated)

The dashboard uses deterministic server calculations. Advisor requests are
authenticated and return backward-compatible `reply` and `timestamp` fields,
plus an intent, calculation metrics, and source metadata for knowledge-backed
answers. Snapshot creation is deduplicated to one record per user per day.

## Production Notes

Set a managed MongoDB connection string, restrict `FRONTEND_ORIGINS` to the
deployed client origin, and run the API with `npm start`. Put TLS termination,
secret management, and process supervision at the deployment boundary.
