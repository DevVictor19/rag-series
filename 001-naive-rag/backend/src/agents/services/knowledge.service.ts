import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { TaskType } from '@google/generative-ai';
import { PDFParse } from 'pdf-parse';
import { AbstractKnowledgeService } from './abstract';

interface Metadata {
  source: string;
  page: number;
}

@Injectable()
export class KnowledgeService implements AbstractKnowledgeService {
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  private readonly embeddings: GoogleGenerativeAIEmbeddings;
  private vectorStore: QdrantVectorStore | null = null;

  constructor(private readonly configService: ConfigService) {
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      model: 'gemini-embedding-001',
      taskType: TaskType.RETRIEVAL_DOCUMENT,
      apiKey: this.configService.getOrThrow<string>('GOOGLE_API_KEY'),
    });
  }

  async processFile(filename: string, fileBuffer: Buffer): Promise<void> {
    const pages = await this.parsePdf(filename, fileBuffer);
    const chunks = (await this.splitter.splitDocuments(
      pages,
    )) as Document<Metadata>[];

    const vectorStore = await this.getVectorStore();

    await vectorStore.addDocuments(chunks);
  }

  async similaritySearch(query: string, k = 3): Promise<string[]> {
    const vectorStore = await this.getVectorStore();
    const results = await vectorStore.similaritySearch(query, k);
    return results.map((doc) => doc.pageContent);
  }

  private async getVectorStore(): Promise<QdrantVectorStore> {
    if (!this.vectorStore) {
      this.vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        {
          url: this.configService.getOrThrow<string>('QDRANT_URL'),
          collectionName:
            this.configService.getOrThrow<string>('QDRANT_COLLECTION'),
        },
      );
    }

    return this.vectorStore;
  }

  private async parsePdf(
    filename: string,
    fileBuffer: Buffer,
  ): Promise<Document<Metadata>[]> {
    const parser = new PDFParse({ data: new Uint8Array(fileBuffer) });

    try {
      const { pages } = await parser.getText();
      const documents: Document<Metadata>[] = [];

      for (const page of pages) {
        documents.push(
          new Document({
            pageContent: page.text,
            metadata: { source: filename, page: page.num - 1 },
          }),
        );
      }

      return documents;
    } finally {
      await parser.destroy();
    }
  }
}
