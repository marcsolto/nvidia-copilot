import * as vscode from 'vscode';
import { complete } from './nvidiaClient';
import { getApiKey, getModel, isInlineSuggestionsEnabled } from './config';

export class InlineSuggestionProvider implements vscode.InlineCompletionItemProvider {

    constructor(private secrets: vscode.SecretStorage) { }

    public async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionList | vscode.InlineCompletionItem[]> {

        // Check if suggestions are enabled
        if (!isInlineSuggestionsEnabled()) {
            return [];
        }

        let apiKey = await this.secrets.get("nvidiaApiKey") || getApiKey();
        const model = getModel();

        if (!apiKey) {
            return [];
        }

        // Context: last 10 lines before cursor
        const startLine = Math.max(0, position.line - 10);
        const prefix = document.getText(new vscode.Range(startLine, 0, position.line, position.character));

        // Avoid calls if prefix is too short or just spaces
        if (prefix.trim().length < 5) {
            return [];
        }

        if (token.isCancellationRequested) {
            return [];
        }

        try {
            // Optimized prompt for code completion
            const prompt = `You are a code assistant. Complete the following code:\n\n${prefix}`;
            const suggestion = await complete(apiKey, model, prompt);

            if (!suggestion || suggestion.trim().length === 0) {
                return [];
            }

            const item = new vscode.InlineCompletionItem(suggestion);
            item.range = new vscode.Range(position, position);

            return [item];
        } catch (error) {
            console.error("Inline completion error:", error);
            return [];
        }
    }
}
