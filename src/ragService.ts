import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getEmbeddings } from './nvidiaClient';
import { getApiKey } from './config';

interface Chunk {
    text: string;
    filePath: string;
    startLine: number;
    embedding?: number[];
}

export class RagService {
    private chunks: Chunk[] = [];
    private isIndexing = false;
    private indexPath: string;

    constructor(private context: vscode.ExtensionContext) {
        this.indexPath = path.join(this.context.globalStorageUri.fsPath, 'vector_index.json');
        this.loadIndex();
    }

    private async loadIndex() {
        try {
            if (fs.existsSync(this.indexPath)) {
                const data = fs.readFileSync(this.indexPath, 'utf8');
                this.chunks = JSON.parse(data);
            }
        } catch (e) {
            console.error("Failed to load index:", e);
        }
    }

    private async saveIndex() {
        try {
            if (!fs.existsSync(this.context.globalStorageUri.fsPath)) {
                fs.mkdirSync(this.context.globalStorageUri.fsPath, { recursive: true });
            }
            fs.writeFileSync(this.indexPath, JSON.stringify(this.chunks), 'utf8');
        } catch (e) {
            console.error("Failed to save index:", e);
        }
    }

    public async indexWorkspace() {
        if (this.isIndexing) return;
        this.isIndexing = true;

        const apiKey = await this.context.secrets.get("nvidiaApiKey") || getApiKey();
        if (!apiKey) {
            vscode.window.showErrorMessage("NVIDIA API Key required for indexing.");
            this.isIndexing = false;
            return;
        }

        return vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "NVIDIA Copilot: Indexing Workspace",
            cancellable: false
        }, async (progress) => {
            try {
                const files = await vscode.workspace.findFiles('**/*.{ts,js,py,md,txt,c,cpp,h}', '**/node_modules/**');
                const totalFiles = files.length;
                this.chunks = [];

                for (let i = 0; i < totalFiles; i++) {
                    const file = files[i];
                    try {
                        const content = (await vscode.workspace.openTextDocument(file)).getText();
                        const fileChunks = this.splitIntoChunks(content, file.fsPath);
                        this.chunks.push(...fileChunks);
                    } catch (e) { }

                    progress.report({ message: `Crawling ${path.basename(file.fsPath)}`, increment: (1 / totalFiles) * 20 });
                }

                const batchSize = 10;
                for (let i = 0; i < this.chunks.length; i += batchSize) {
                    const batch = this.chunks.slice(i, i + batchSize);
                    const texts = batch.map(c => c.text);
                    const embeddings = await getEmbeddings(apiKey, texts);

                    for (let j = 0; j < batch.length; j++) {
                        batch[j].embedding = embeddings[j];
                    }

                    progress.report({
                        message: `Embedding Chunks (${i + batch.length}/${this.chunks.length})`,
                        increment: (batch.length / this.chunks.length) * 80
                    });
                }

                await this.saveIndex();
                vscode.window.showInformationMessage(`Workspace indexed: ${this.chunks.length} chunks.`);

            } catch (error) {
                vscode.window.showErrorMessage(`Indexing failed: ${error}`);
            } finally {
                this.isIndexing = false;
            }
        });
    }

    public async search(query: string, topN: number = 3): Promise<Chunk[]> {
        const apiKey = await this.context.secrets.get("nvidiaApiKey") || getApiKey();
        if (!apiKey || this.chunks.length === 0) return [];

        try {
            const queryEmbedding = (await getEmbeddings(apiKey, query))[0];

            const scoredChunks = this.chunks
                .filter(c => c.embedding)
                .map(chunk => ({
                    chunk,
                    score: this.cosineSimilarity(queryEmbedding, chunk.embedding!)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, topN);

            return scoredChunks.map(sc => sc.chunk);
        } catch (error) {
            console.error("Search error:", error);
            return [];
        }
    }

    private splitIntoChunks(content: string, filePath: string): Chunk[] {
        const maxChars = 1000;
        const chunks: Chunk[] = [];
        const lines = content.split('\n');

        let currentText = "";
        let startLine = 0;

        for (let i = 0; i < lines.length; i++) {
            currentText += lines[i] + "\n";
            if (currentText.length > maxChars) {
                chunks.push({ text: currentText, filePath, startLine });
                currentText = "";
                startLine = i + 1;
            }
        }

        if (currentText.trim()) {
            chunks.push({ text: currentText, filePath, startLine });
        }

        return chunks;
    }

    private cosineSimilarity(vecA: number[], vecB: number[]): number {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        if (normA === 0 || normB === 0) return 0;
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
