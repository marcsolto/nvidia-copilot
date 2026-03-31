import * as vscode from 'vscode';
import { chat } from './nvidiaClient';
import { addUserMessage, addAssistantMessage, getMessages } from './chatHistory';
import { getApiKey, getModel } from './config';
import { createChatPanel } from './webviewPanel';
import { InlineSuggestionProvider } from './inlineSuggestions';
import { RagService } from './ragService';

let chatPanel: vscode.WebviewPanel | undefined;
let ragService: RagService;

export function activate(context: vscode.ExtensionContext) {

	ragService = new RagService(context);

	// Register Inline Completion Provider (Ghost Text)
	const inlineProvider = new InlineSuggestionProvider(context.secrets);
	context.subscriptions.push(
		vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, inlineProvider)
	);

	// Function to handle chat logic (streaming and UI updates)
	async function performChat(userInput: string, panel: vscode.WebviewPanel) {
		const apiKey = await context.secrets.get("nvidiaApiKey") || getApiKey();
		const model = getModel();

		if (!apiKey) {
			vscode.window.showErrorMessage('NVIDIA API Key not configured.');
			return;
		}

		// RAG: Search for relevant context across workspace
		panel.webview.postMessage({ type: 'update', content: "_Searching workspace context..._" });
		const relevantChunks = await ragService.search(userInput);

		let historyPrompt = userInput;
		if (relevantChunks.length > 0) {
			const contextText = relevantChunks
				.map(c => `File: ${c.filePath}\nContent:\n${c.text}`)
				.join("\n\n---\n\n");

			historyPrompt = `Context from workspace:\n${contextText}\n\nUser Question: ${userInput}`;
		}

		// Save to history
		addUserMessage(historyPrompt);

		try {
			let fullTextResponse = "";

			await chat(apiKey, model, getMessages(), (token: string) => {
				fullTextResponse += token;
				panel.webview.postMessage({ type: 'update', content: fullTextResponse });
			});

			// Save response to history
			addAssistantMessage(fullTextResponse);

		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`NVIDIA API Error: ${msg}`);
			console.error("Chat error:", error);
		}
	}

	// Main command: open chat and ask AI
	let disposable = vscode.commands.registerCommand('nvidia.copilot', async () => {
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

		// Create history prompt with local context (active file)
		const localPrompt = selectionContext
			? `${userInput}\n\nActive file context:\n\`\`\`\n${selectionContext}\n\`\`\``
			: userInput;

		// Create or reuse panel
		if (!chatPanel) {
			chatPanel = createChatPanel();
			setupChatPanelListeners(chatPanel);
		}
		chatPanel.reveal(vscode.ViewColumn.Beside);

		// Post user message to UI (clean version without technical context)
		chatPanel.webview.postMessage({ type: 'addMessage', content: userInput, isUser: true });

		// Perform chat with RAG + Local Context
		await performChat(localPrompt, chatPanel);
	});

	context.subscriptions.push(disposable);

	// Command to index workspace
	let indexDisposable = vscode.commands.registerCommand('nvidia.indexWorkspace', async () => {
		await ragService.indexWorkspace();
	});
	context.subscriptions.push(indexDisposable);

	function setupChatPanelListeners(panel: vscode.WebviewPanel) {
		panel.onDidDispose(() => { chatPanel = undefined; }, null, context.subscriptions);

		panel.webview.onDidReceiveMessage(async (message) => {
			if (message.type === 'userMessage') {
				await performChat(message.value, panel);
			}
		}, undefined, context.subscriptions);
	}

	// Command to list models
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

	// Command for API key
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