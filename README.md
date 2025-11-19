# Chat History by ID — Next.js + Vercel AI SDK + Neon Postgres

A minimal, production-ready example showing how to:

* Start streamed AI chat sessions
* Store each conversation in a **Neon Postgres database**
* List all previous chats with auto-generated titles
* Open any chat by its unique ID and continue the conversation
* Control system behavior through a single customizable prompt file

Chats are persisted using **Neon**, ensuring durable storage across deployments and eliminating the limitations of serverless filesystem writes on Vercel.

This project follows the Vercel AI SDK patterns for message persistence:
[https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)

---

## Features

* **Streaming AI responses** using the Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
* **Persistent chat storage** in **Neon Postgres**
* **Auto-generated titles** from the first user message
* **Session list view** on the home page
* **Per-chat routing** via `/[id]`
* **Single-point system behavior configuration** in `lib/prompts/system-prompt.ts`
* **Dark-mode UI**, minimal and clean

---

## Tech Stack

* **Framework:** Next.js (App Router)
* **Runtime:** Node.js
* **Database:** Neon Postgres
* **AI / Streaming:** Vercel AI SDK
* **UI:** React + TypeScript
* **Rendering:** `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
* **Styling:** Tailwind-style utilities

---

## Getting Started

### 1. Prerequisites

* Node.js (LTS recommended)
* A Neon database (free tier works perfectly)

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

> Without `OPENAI_API_KEY`, the chat route cannot generate responses.

### 4. Create the database table

Run in Neon:

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
```

Then visit:

```
http://localhost:3000
```

---

## How It Works

### Chat API — `/app/api/chat/route.ts`

The backend:

* Receives `{ messages, id }` from the client
* Streams a response with `streamText`
* Uses `openai('gpt-4o-mini')`
* Applies `systemPrompt`
* Saves the updated chat record to Neon when the stream finishes

Example:

```ts
const result = streamText({
  model: openai('gpt-4o-mini'),
  messages: convertToModelMessages(messages),
  system: systemPrompt,
});
```

And the persistence call:

```ts
saveChat({ chatId: id, messages });
```

---

## Chat Persistence — Neon Storage

Implemented in:

```
/util/chat-store.ts
```

This module handles:

* `createChat()` → generates a new chat ID
* `saveChat()` → upserts the messages into Neon
* `loadChat(id)` → retrieves full history for that chat
* `getChats()` → fetches all chats sorted by newest first
* Auto-title extraction from the first user message

This replaces the former `.chats` directory approach and now works safely on Vercel’s serverless runtime.

---

## System Prompt Customization

Location:

```
/lib/prompts/system-prompt.ts
```

This string defines how the assistant behaves and what topics it focuses on.
Modify it to change personality, formatting rules, domain boundaries, or explanation depth—without changing any other part of the app.

---

## Frontend Overview

### Home Page — `/app/page.tsx`

* Fetches all chats from Neon
* Displays each as a clickable card
* The “+ New Chat” button creates a new chat ID and redirects to `/[id]`

### Chat Page — `/app/[id]/page.tsx`

* Loads stored messages from Neon
* Hydrates the chat UI
* Lets the user continue chatting with persistence

### Chat UI — `/ui/chat.tsx`

* Uses `useChat` from `@ai-sdk/react`
* Streams responses live
* Renders markdown assistant messages
* Renders user messages on the right, assistant on the left

---

## Visual Walkthrough — Application Flow

### **1. Initial Home Page**

The app starts with no chats stored yet.

![Step 1](https://ik.imagekit.io/imagehost2/1.png)

---

### **2. Creating a New Chat**

Click “+ New Chat” to generate a new session ID and enter the chat view.

![Step 2](https://ik.imagekit.io/imagehost2/2.png)

---

### **3. Asking a Question**

The user sends a message, and the AI responds via streaming.
The entire exchange is saved in Neon.

![Step 3](https://ik.imagekit.io/imagehost2/3.png)

---

### **4. Returning Home — Chat Now Appears**

The new session is now visible on the home page and can be reopened anytime.

![Step 4](https://ik.imagekit.io/imagehost2/4.png)

---

## Typical Flow

1. Open the app
2. Create a new chat → redirected to `/some-id`
3. Send messages and receive streamed AI responses
4. Chat automatically persists to Neon
5. Return to home → session is listed and clickable
6. Reopen the chat to continue where you left off

---

## Notes

* Storage is fully compatible with Vercel’s serverless architecture
* Chats are uniquely identified by ID
* Ideal as a reference implementation for persistent AI chat systems

