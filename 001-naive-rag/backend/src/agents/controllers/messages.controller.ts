import { Body, Controller, Post } from '@nestjs/common';
import { SendMessageInputDto, SendMessageOutputDto } from '../dtos';
import { AbstractMessagesService } from '../services';

@Controller({
  path: 'messages',
  version: '1',
})
export class MessagesController {
  constructor(private readonly messagesService: AbstractMessagesService) {}

  @Post()
  async send(@Body() dto: SendMessageInputDto): Promise<SendMessageOutputDto> {
    const result = await this.messagesService.processQuery(dto.query);
    return result;
  }
}
