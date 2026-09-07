import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageInputDto {
  @IsString()
  @IsNotEmpty()
  query!: string;
}

export class SendMessageOutputDto {
  response!: string;
  references!: string[];
}
