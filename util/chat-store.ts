import { UIMessage } from 'ai';
import { generateId } from 'ai';
import { sql } from '@/lib/db';

type ChatRow = {
  id: string;
  title: string;
  last_modified: string;
};

function deriveTitle(messages: UIMessage[]): string {
  let title = 'New Chat';

  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (firstUserMsg) {
    const textPart = firstUserMsg.parts.find((p) => p.type === 'text');
    if (textPart?.text) {
      const text = textPart.text.trim();
      title = text.length > 40 ? text.slice(0, 40) + '...' : text;
    }
  }

  return title;
}

export async function createChat(): Promise<string> {
  return generateId();
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  if (!id || typeof id !== 'string') return [];

  const rows = await sql`
    SELECT messages
    FROM chats
    WHERE id = ${id}
  `;

  if (rows.length === 0) return [];

  const row = rows[0] as { messages: unknown };
  const raw = row.messages;

  if (!raw) return [];

  // If driver returns the JSON string, parse it; if it returns an object/array, just return it.
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as UIMessage[];
    } catch {
      return [];
    }
  }

  return raw as UIMessage[];
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  if (!chatId) {
    throw new Error(`saveChat called without a valid chatId: "${chatId}"`);
  }

  const title = deriveTitle(messages);
  const messagesJson = JSON.stringify(messages); // ✅ valid JSON text

  await sql`
    INSERT INTO chats (id, messages, title, last_modified)
    VALUES (${chatId}, ${messagesJson}, ${title}, NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      messages = EXCLUDED.messages,
      title = EXCLUDED.title,
      last_modified = EXCLUDED.last_modified;
  `;
}

export async function getChats(): Promise<
  { id: string; title: string; lastModified: number }[]
> {
  // ❌ sql<ChatRow[]>`...`  (not allowed)
  // ❌ Cannot apply type arguments to neon client
  const rows = await sql`
    SELECT id, title, last_modified
    FROM chats
    ORDER BY last_modified DESC
  `;

  return (rows as ChatRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    lastModified: new Date(row.last_modified).getTime(),
  }));
}
