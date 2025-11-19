# Chat History by ID — Next.js + Vercel AI SDK

A minimal Next.js application that lets you:

- Start streamed AI chat sessions
- Persist each conversation to disk
- List previous sessions with auto-generated titles
- Re-open any session by its unique ID and continue chatting
- Customize the system behavior through a single prompt file

All chat state is stored locally in a `.chats/` folder at the project root, using simple JSON files.

---

## Features

- **Streaming AI responses** using the Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`).
- **Local chat persistence** in `.chats/*.json`.
- **Session listing page** showing all previous chats with titles derived from the first user message.
- **Per-chat URL routing** via `/[id]`, so each chat is addressable and reloadable.
- **Customizable system prompt** in `lib/prompts/system-prompt.ts` so behavior can be easily adapted.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Runtime:** Node.js
- **AI / Streaming:** Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
- **UI:** React, TypeScript
- **Markdown Rendering:** `react-markdown`, `remark-gfm`, `react-syntax-highlighter`
- **Styling:** Tailwind-style utility classes via global CSS

---

## Getting Started

### 1. Prerequisites

- Node.js (LTS recommended)
- `npm`, `pnpm`, or `yarn`

### 2. Clone and install

```bash
git clone <your-repo-url>
cd <your-repo-folder>

# choose one
npm install
# or
pnpm install
# or
yarn install
````

### 3. Environment variables

Create a `.env.local` (or `.env`) file at the root of the project and set your OpenAI key:

```bash
OPENAI_API_KEY=sk-...
```

The `@ai-sdk/openai` provider will use this environment variable to authenticate when calling:

```ts
import { openai } from '@ai-sdk/openai';

const model = openai('gpt-4o-mini');
```

> Without `OPENAI_API_KEY`, the `/api/chat` endpoint will fail.

### 4. Run the dev server

```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

Then open:

* `http://localhost:3000` in your browser.

---

## How It Works

### Backend — Chat API

**File:** `/app/api/chat/route.ts`

* Accepts a JSON body with:

  * `messages: UIMessage[]`
  * `chatId: string`
* Uses the Vercel AI SDK to:

  * Convert UI messages → model messages
  * Call `openai('gpt-4o-mini')`
  * Apply the `systemPrompt` from `lib/prompts/system-prompt.ts`
  * Stream the response back to the client
* On stream completion, it calls `saveChat({ chatId, messages })` to persist the chat.

Relevant code:

```ts
import { openai } from '@ai-sdk/openai';
import { saveChat } from '@/util/chat-store';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { systemPrompt } from '@/lib/prompts/system-prompt';

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[]; chatId: string } =
    await req.json();

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: convertToModelMessages(messages),
    system: systemPrompt,
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages }) => {
      saveChat({ chatId, messages });
    },
  });
}
```

---

### Chat Persistence

**File:** `/util/chat-store.ts`

Key responsibilities:

* **`createChat()`**: generates a new ID (using `generateId()` from `ai`) without writing a file yet.
* **`saveChat({ chatId, messages })`**: writes messages to `.chats/<chatId>.json`.
* **`loadChat(id)`**: reads `.chats/<id>.json` if it exists, otherwise returns an empty array.
* **`getChats()`**: scans the `.chats` folder, reads each file, and:

  * Uses the first user message to generate a human-friendly title (truncated to 40 chars).
  * Sorts results by `lastModified` descending so newest chats appear first.

The `.chats` directory is created automatically if it doesn’t exist.

---

### System Prompt Customization

**File:** `/lib/prompts/system-prompt.ts`

```ts
export const systemPrompt =
  `You are a helpful assistant who responds to questions concerning the underlying system or architecture as it relates to ChatGPT, the Vercel AI SDK, and the chat streaming capabilities and functionality.`;
```

You can freely modify this string to:

* Change the assistant’s personality
* Restrict or expand its domain
* Adjust formatting or output style

This is the main place for altering how the AI responds without touching the rest of the app.

---

## Frontend / UI Flow

### 1. Home Page — listing chat sessions

**File:** `/app/page.tsx`

* Loads all chats with `getChats()`.
* Displays a grid of cards:

  * Title derived from the first user message.
  * Timestamp (last modified).
* Provides a `+ New Chat` button:

  * Calls `createChat()` on the server.
  * Redirects to `/[id]` for that new chat.

URL: `/`
Purpose: overview of all stored sessions.

---

### 2. Chat Page — per-session chat by ID

**File:** `/app/[id]/page.tsx`

* Receives `id` from route params.
* Uses `loadChat(id)` to hydrate `initialMessages`.
* Renders the `Chat` component with this `id` and the loaded messages.
* Includes a simple “Back to all chats” header link.

URL pattern: `/:id`
Purpose: view + continue an existing chat.

---

### 3. Chat Component — streaming UI

**File:** `/ui/chat.tsx`

* Uses `useChat` from `@ai-sdk/react` with:

  * `id` (the same `chatId` used for persistence)
  * `initialMessages` (loaded from disk)
  * `DefaultChatTransport` to point at `/api/chat`
* Renders:

  * User messages as right-aligned bubbles.
  * Assistant messages as left-aligned bubbles with Markdown rendering.
  * Code blocks with syntax highlighting via `react-syntax-highlighter` and `remark-gfm`.
* Includes a fixed bottom input bar for sending new messages.

---

## Typical Usage

1. **Start the dev server** and open `http://localhost:3000`.
2. Click **“+ New Chat”**:

   * A new chat ID is created.
   * You are redirected to `/:id`.
3. Type a question in the input box and hit **Enter** (or click **Send**):

   * Messages stream in from the backend.
   * At the end of the stream, the conversation is saved to `.chats/<id>.json`.
4. Go back to `/`:

   * The new chat appears in the list with a title derived from your first message.
5. Click any chat card:

   * You’re taken to `/:id` for that chat.
   * Previous history is loaded, and you can continue the conversation.


---

## Notes & Limitations

* Storage is **local** and **file-based** (`.chats/`). For production use, consider replacing this with a database.
* Session persistence is tied to the `chatId`. If you change IDs or delete files manually, corresponding sessions will disappear from the UI.
* The application focuses on **streaming chat** and **retrieval by ID**, not on user auth, multi-user separation, or access control.

---


