Here is a clean, concise, updated README rewritten to reflect your new **Neon-backed persistence layer** while preserving the overall structure and tone of the original file.

---

# Chat History by ID — Next.js + Vercel AI SDK + Neon Postgres

A minimal, production-ready example showing how to:

* Start streamed AI chat sessions
* Store each conversation in a **Neon Postgres database**
* List all previous chats with auto-generated titles
* Open any chat by its unique ID and continue the conversation
* Control system behavior through a single customizable prompt file

Chats are now persisted using **Neon**, giving durable storage across deployments and fully solving the limitations of serverless filesystem writes on Vercel.

This project follows the Vercel AI SDK patterns for message persistence:
[https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)

---

## Features

* **Streaming AI responses** via the Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`).
* **Persistent chat storage** using **Neon Postgres**, not local disk.
* **Automatic titles** derived from the first user message.
* **Session listing** on the home page.
* **Per-chat routing** using `/[id]` paths.
* **Configurable system behavior** through `lib/prompts/system-prompt.ts`.
* **Dark-mode UI** styled with utility classes.

---

## Tech Stack

* **Framework:** Next.js (App Router)
* **Runtime:** Node.js
* **Database:** Neon Postgres
* **AI / Streaming:** Vercel AI SDK
* **UI:** React + TypeScript
* **Markdown Rendering:** `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
* **Styling:** Tailwind-style utility classes

---

## Getting Started

### 1. Prerequisites

* Node.js (LTS)
* A Neon database (free tier is fine)

### 2. Clone and install

```bash
git clone https://github.com/awselliottai/persistent-chat-by-id.git persistent-chat-by-id
cd persistent-chat-by-id

npm install
# or pnpm install
# or yarn install
```

### 3. Environment variables

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://<YOUR-NEON-STRING>
```

> `DATABASE_URL` should match the connection string provided by Neon.
> Without `OPENAI_API_KEY`, the chat API cannot generate responses.

### 4. Create the database table

Run this SQL in the Neon dashboard:

```sql
CREATE TABLE IF NOT EXISTS chats (
  id TEXT PRIMARY KEY,
  messages JSONB NOT NULL,
  title TEXT NOT NULL,
  last_modified TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 5. Start the dev server

```bash
npm run dev
# or pnpm dev
# or yarn dev
```

Visit:

```
http://localhost:3000
```

---

## How It Works

### Chat API — `/app/api/chat/route.ts`

The backend endpoint:

* Receives `{ messages, id }` from the AI SDK transport
* Streams a response using `openai('gpt-4o-mini')`
* Applies `systemPrompt` from `lib/prompts/system-prompt.ts`
* On stream completion, saves the chat to Neon

Core logic:

```ts
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: convertToModelMessages(messages),
  system: systemPrompt,
});
```

Messages are stored via:

```ts
saveChat({ chatId: id, messages });
```

---

## Chat Persistence — Neon Storage

Implemented in:

```
/util/chat-store.ts
```

Responsibilities:

* `createChat()` → generates a new unique chat ID
* `saveChat()` → upserts messages into Neon
* `loadChat(id)` → fetches stored history for that chat
* `getChats()` → returns all chats, sorted by `last_modified`
* Titles are extracted from the first user message and truncated to 40 characters

This storage replaces the previous `.chats` filesystem directory, which is not suitable for Vercel serverless environments.

---

## System Prompt Customization

Location:

```
/lib/prompts/system-prompt.ts
```

This file defines the assistant's behavior. Modify the string to:

* Change personality
* Restrict or expand the domain
* Adjust formatting or voice

No other files must be changed to alter chat behavior.

---

## Frontend Overview

### Home Page — `/app/page.tsx`

* Calls `getChats()` (Neon → list of stored chats)
* Displays them as clickable cards
* `+ New Chat` creates an ID and redirects to `/[id]`

### Chat Page — `/app/[id]/page.tsx`

* Loads existing messages via `loadChat(id)`
* Hydrates the chat UI
* Continues the conversation with server-side persistence

### Chat UI — `/ui/chat.tsx`

* Uses `useChat` from `@ai-sdk/react`
* Streams responses in real time
* Renders assistant messages with Markdown + syntax highlighting
* Shows user messages right-aligned, assistant left-aligned

---

## Typical Flow

1. Open the app.
2. Click **“+ New Chat”** → redirected to `/some-id`.
3. Chat with streamed responses.
4. Messages automatically save to Neon.
5. Return to `/` → the new session appears with a generated title.
6. Click any chat to resume it.

---

## Notes

* Chat storage now works reliably in **production** because it uses Neon, not ephemeral filesystem storage.
* IDs uniquely identify sessions; deleting a row removes a chat.
* This setup is intentionally minimal and intended as a reference implementation for developers integrating persistence into AI chat applications.


