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
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <div className="p-4 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur">
        <Link
          href="/"
          className="text-neutral-300 hover:text-neutral-100 hover:underline"
        >
          ← Back to all chats
        </Link>
      </div>
      <Chat id={id} initialMessages={messages} />
    </div>
  );
}
