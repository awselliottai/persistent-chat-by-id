import { openai } from '@ai-sdk/openai';
import { saveChat } from '@/util/chat-store';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { systemPrompt } from '@/lib/prompts/system-prompt';

export async function POST(req: Request) {
  const { messages, id }: { messages: UIMessage[]; id: string } =
    await req.json();

  const chatId = id; 

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
