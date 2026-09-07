import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createAgent } from 'langchain';
import {
  AbstractKnowledgeService,
  AbstractMessagesService,
  ProcessQueryResult,
} from './abstract';

@Injectable()
export class MessagesService implements AbstractMessagesService {
  private readonly model: ChatGoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly knowledgeService: AbstractKnowledgeService,
  ) {
    this.model = new ChatGoogleGenerativeAI({
      verbose: true,
      model: 'gemini-3.5-flash-lite',
      apiKey: this.configService.getOrThrow<string>('GOOGLE_API_KEY'),
    });
  }

  async processQuery(query: string): Promise<ProcessQueryResult> {
    const references = await this.knowledgeService.similaritySearch(query);

    const context = references.length
      ? references.map((doc, index) => `[${index + 1}] ${doc}`).join('\n\n')
      : 'No relevant documents were found.';

    const agent = createAgent({
      model: this.model,
      systemPrompt: [
        'You are an assistant that answers questions based only on the context provided below.',
        "If the answer is not in the context, say that you don't have that information.",
        '',
        'Context:',
        context,
      ].join('\n'),
    });

    const result = await agent.invoke({
      messages: [{ role: 'user', content: query }],
    });

    const lastMessage = result.messages[result.messages.length - 1];

    return {
      response: lastMessage.content as string,
      references,
    };
  }
}
