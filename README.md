# NYX Assist

## Requirements

- Node.js 24 (client) and 22 (server), pinned in `.nvmrc`
- Docker (PostgreSQL)
- [Ollama](https://ollama.com)

## Setup

### Model

```bash
ollama pull qwen3.5:4b
```

### PostgreSQL (Docker)

```bash
docker run --name chatbot-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=chatbot \
  -p 5432:5432 -d postgres:16
```

Next time, start the existing container with:

```bash
docker start chatbot-db
```

### Server

```bash
cd server
npm install
```

Create `server/.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/chatbot"
```

Apply migrations and start:

```bash
npx prisma migrate deploy
npm run dev
```

Runs on `http://localhost:3001`.

### Client

From the project root:

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`.