import * as vscode from 'vscode';
import { chat } from './nvidiaClient';
import { addUserMessage, addAssistantMessage, getMessages } from './chatHistory';
import { getApiKey, getModel } from './config';
import { createChatPanel } from './webviewPanel';
import { InlineSuggestionProvider } from './inlineSuggestions';

let chatPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {

	// Register Inline Completion Provider (Ghost Text)
	const inlineProvider = new InlineSuggestionProvider(context.secrets);
	context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, inlineProvider)
	);

	// Main command: open chat and ask AI
	let disposable = vscode.commands.registerCommand('nvidia.copilot', async () => {
		let apiKey = await context.secrets.get("nvidiaApiKey") || getApiKey();

		const model = getModel();

		if (!apiKey) {
			const result = await vscode.window.showErrorMessage(
				'NVIDIA API Key not configured.',
				'Configure Now'
			);
			if (result === 'Configure Now') {
				vscode.commands.executeCommand('nvidia.setApiKey');
			}
			return;
		}

		const editor = vscode.window.activeTextEditor;
		let selectionContext = "";
		if (editor) {
			const selection = editor.selection;
			if (!selection.isEmpty) {
				selectionContext = editor.document.getText(selection);
			} else {
				selectionContext = editor.document.getText();
			}
		}

		const userInput = await vscode.window.showInputBox({
			prompt: "Ask something about your code",
			value: ""
		});
		if (!userInput) {
			return;
		}

		// Add user question to history with technical context
		const historyPrompt = selectionContext
			? `${userInput}\n\nCode context:\n\`\`\`\n${selectionContext}\n\`\`\``
			: userInput;

		addUserMessage(historyPrompt);

		// Create or reuse chat panel
		if (!chatPanel) {
			chatPanel = createChatPanel();
			chatPanel.onDidDispose(() => { chatPanel = undefined; }, null, context.subscriptions);
		}
		chatPanel.reveal(vscode.ViewColumn.Beside);

		// Show user message in webview
		chatPanel.webview.postMessage({ type: 'addMessage', content: userInput, isUser: true });

		// Read streaming from IA
		try {
			let fullTextResponse = "";

			await chat(apiKey, model, getMessages(), (token: string) => {
				fullTextResponse += token;
				chatPanel?.webview.postMessage({ type: 'update', content: fullTextResponse });
			});

			// Save IA response in history
			addAssistantMessage(fullTextResponse);

		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`NVIDIA API Error: ${msg}`);
			console.error("Streaming chat error:", error);
		}
	});

	context.subscriptions.push(disposable);

	// Command to list available models
	let listModelsDisposable = vscode.commands.registerCommand('nvidia.listModels', async () => {
		let apiKey = await context.secrets.get("nvidiaApiKey") || getApiKey();
		if (!apiKey) {
			vscode.window.showErrorMessage('Please configure your NVIDIA API Key first.');
			return;
		}

		try {
			const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${apiKey}`,
					"Accept": "application/json"
				}
			});

			if (!response.ok) {
				const text = await response.text();
				throw new Error(`${response.status} ${response.statusText} - ${text}`);
			}

			const data = await response.json() as { data: { id: string }[] };
			const models = data.data.map(m => m.id);

			const selectedModel = await vscode.window.showQuickPick(models, {
				placeHolder: 'Select an NVIDIA model'
			});

			if (selectedModel) {
				await vscode.workspace.getConfiguration("nvidiaCopilot")
					.update("model", selectedModel, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Model updated to: ${selectedModel}`);
			}

		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Error fetching models: ${msg}`);
		}
	});

	context.subscriptions.push(listModelsDisposable);

	// Command to configure API key securely
	let setKeyDisposable = vscode.commands.registerCommand('nvidia.setApiKey', async () => {
		const key = await vscode.window.showInputBox({
			prompt: "Enter your NVIDIA API Key",
			password: true,
			ignoreFocusOut: true
		});
		if (key) {
			await context.secrets.store("nvidiaApiKey", key);
			vscode.window.showInformationMessage("API Key saved securely!");
		}
	});

	context.subscriptions.push(setKeyDisposable);
}

export function deactivate() { }