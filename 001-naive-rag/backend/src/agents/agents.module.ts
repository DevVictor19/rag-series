import { Module } from '@nestjs/common';
import { KnowledgeController, MessagesController } from './controllers';
import {
  AbstractKnowledgeService,
  AbstractMessagesService,
  KnowledgeService,
  MessagesService,
} from './services';

@Module({
  controllers: [KnowledgeController, MessagesController],
  providers: [
    {
      provide: AbstractKnowledgeService,
      useClass: KnowledgeService,
    },
    {
      provide: AbstractMessagesService,
      useClass: MessagesService,
    },
  ],
})
export class AgentsModule {}
