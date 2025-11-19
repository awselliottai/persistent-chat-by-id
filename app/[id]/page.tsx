import { loadChat } from '@/util/chat-store';
import Chat from '@/ui/chat';
import Link from 'next/link';

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const messages = await loadChat(id);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur">
        <Link
          href="/"
          className="text-emerald-400 hover:text-emerald-300 hover:underline"
        >
          ← Back to all chats
        </Link>
      </div>
      <Chat id={id} initialMessages={messages} />
    </div>
  );
}
