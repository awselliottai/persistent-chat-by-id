import { UIMessage } from 'ai';
import { generateId } from 'ai';
import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import path from 'path';

function getChatFile(id: string): string {
  const chatDir = path.join(process.cwd(), '.chats');
  if (!existsSync(chatDir)) mkdirSync(chatDir, { recursive: true });
  return path.join(chatDir, `${id}.json`);
}

export async function createChat(): Promise<string> {
  // We no longer create an empty file here → file is created only when first response finishes
  return generateId();
}

export async function loadChat(id: string): Promise<UIMessage[]> {
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
  const content = JSON.stringify(messages, null, 2);
  await writeFile(getChatFile(chatId), content);
}

export async function getChats(): Promise<
  { id: string; title: string; lastModified: number }[]
> {
  const chatDir = path.join(process.cwd(), '.chats');

  if (!existsSync(chatDir)) return [];

  const files = await readdir(chatDir);

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
        } catch (e) {
          // corrupt file → just show generic title
        }

        return { id, title, lastModified: stats.mtimeMs };
      })
  );

  // newest first
  return chatData.sort((a, b) => b.lastModified - a.lastModified);
}