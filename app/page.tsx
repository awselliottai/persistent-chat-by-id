// /app/page.tsx

import { getChats, createChat } from '@/util/chat-store';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const chats = await getChats();

  async function createNewChat() {
    'use server';
    const newId = await createChat();
    redirect(`/${newId}`);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-10 text-center">
          My Chats
        </h1>

        <form action={createNewChat} className="mb-12 text-center">
          <button
            type="submit"
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transition disabled:opacity-50"
          >
            + New Chat
          </button>
        </form>

        {chats.length === 0 ? (
          <div className="text-center text-neutral-400 mt-20">
            <p className="text-xl">No chats yet.</p>
            <p>Create a new one to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chats.map((chat) => (
              <Link
                key={chat.id}
                href={`/${chat.id}`}
                className="block p-6 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-500 hover:shadow-lg hover:shadow-black/40 transition"
              >
                <h2 className="font-medium text-lg truncate text-neutral-50">
                  {chat.title}
                </h2>
                <p className="text-sm text-neutral-400 mt-2">
                  {new Date(chat.lastModified).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
