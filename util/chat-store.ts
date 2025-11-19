// /util/chat-store.ts

import { UIMessage } from 'ai';
import { generateId } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import path from 'path';

const isVercel = !!process.env.VERCEL;

/**
 * Resolve the base directory for chat storage.
 * - Local dev: project root
 * - Vercel: /tmp (writable but ephemeral)
 */
function getChatDir(): string {
  const baseDir = isVercel ? '/tmp' : process.cwd();
  const chatDir = path.join(baseDir, '.chats');

  if (!existsSync(chatDir)) {
    mkdirSync(chatDir, { recursive: true });
  }

  return chatDir;
}

function getChatFile(id: string): string {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid chat ID: "${id}"`);
  }

  const chatDir = getChatDir();
  return path.join(chatDir, `${id}.json`);
}

export async function createChat(): Promise<string> {
  return generateId();
}

export async function loadChat(id: string): Promise<UIMessage[]> {
  if (!id || typeof id !== 'string') return [];

  const filePath = getChatFile(id);

  return existsSync(filePath)
    ? JSON.parse(await readFile(filePath, 'utf8'))
    : [];
}

export async function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): Promise<void> {
  if (!chatId || typeof chatId !== 'string') {
    throw new Error(`saveChat called without a valid chatId: "${chatId}"`);
  }

  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(chatId), content);
}

export async function getChats(): Promise<
  { id: string; title: string; lastModified: number }[]
> {
  const chatDir = getChatDir();

  const files = existsSync(chatDir) ? await readdir(chatDir) : [];

  const chatData = await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map(async (file) => {
        const id = file.replace('.json', '');
        const filePath = getChatFile(id);
        const stats = await stat(filePath);

        let title = 'New Chat';

        try {
          const messages: UIMessage[] = JSON.parse(
            await readFile(filePath, 'utf8')
          );

          if (messages.length > 0) {
            const firstUserMsg = messages.find((m) => m.role === 'user');
            if (firstUserMsg) {
              const textPart = firstUserMsg.parts.find(
                (p) => p.type === 'text'
              );
              if (textPart?.text) {
                const text = textPart.text.trim();
                title =
                  text.length > 40 ? text.slice(0, 40) + '...' : text;
              }
            }
          }
        } catch {
          // Ignore corrupt files and fall back to default title
        }

        return { id, title, lastModified: stats.mtimeMs };
      })
  );

  // newest first
  return chatData.sort((a, b) => b.lastModified - a.lastModified);
}
