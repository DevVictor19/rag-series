export abstract class AbstractKnowledgeService {
  abstract processFile(filename: string, fileBuffer: Buffer): Promise<void>;
  abstract similaritySearch(query: string, k?: number): Promise<string[]>;
}
