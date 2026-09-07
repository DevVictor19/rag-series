export interface ProcessQueryResult {
  response: string;
  references: string[];
}

export abstract class AbstractMessagesService {
  abstract processQuery(query: string): Promise<ProcessQueryResult>;
}
