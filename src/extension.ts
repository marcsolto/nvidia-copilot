import * as vscode from 'vscode';
import { chat } from './nvidiaClient';
import { addUserMessage, addAssistantMessage, getMessages } from './chatHistory';
import { getApiKey, getModel } from './config';
import { createChatPanel } from './webviewPanel';

let chatPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {

	// Comando principal: abrir chat e perguntar à IA
	let disposable = vscode.commands.registerCommand('nvidia.copilot', async () => {
		let apiKey = await context.secrets.get("nvidiaApiKey") || getApiKey();

		const model = getModel();

		if (!apiKey) {
			const result = await vscode.window.showErrorMessage(
				'NVIDIA API Key não configurada.',
				'Configurar Agora'
			);
			if (result === 'Configurar Agora') {
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
			prompt: "Pergunte algo sobre seu código",
			value: ""
		});
		if (!userInput) {
			return;
		}

		// Adicionar pergunta do usuário ao histórico com contexto técnico (escondido do chat visual se possível)
		const historyPrompt = selectionContext
			? `${userInput}\n\nContexto do código:\n\`\`\`\n${selectionContext}\n\`\`\``
			: userInput;

		addUserMessage(historyPrompt);

		// Criar ou reutilizar painel de chat
		if (!chatPanel) {
			chatPanel = createChatPanel();
			chatPanel.onDidDispose(() => { chatPanel = undefined; }, null, context.subscriptions);
		}
		chatPanel.reveal(vscode.ViewColumn.Beside);

		// Mostrar mensagem do usuário no webview (apenas o que ele digitou)
		chatPanel.webview.postMessage({ type: 'addMessage', content: userInput, isUser: true });

		// Ler streaming da IA
		try {
			let fullTextResponse = "";

			await chat(apiKey, model, getMessages(), (token: string) => {
				fullTextResponse += token;
				chatPanel?.webview.postMessage({ type: 'update', content: fullTextResponse });
			});

			// Salvar resposta da IA no histórico
			addAssistantMessage(fullTextResponse);

		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Erro na NVIDIA API: ${msg}`);
			console.error("Streaming chat error:", error);
		}
	});

	context.subscriptions.push(disposable);

	// Comando para listar modelos disponíveis
	let listModelsDisposable = vscode.commands.registerCommand('nvidia.listModels', async () => {
		let apiKey = await context.secrets.get("nvidiaApiKey") || getApiKey();
		if (!apiKey) {
			vscode.window.showErrorMessage('Configure sua NVIDIA API Key primeiro.');
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
				placeHolder: 'Selecione um modelo NVIDIA'
			});

			if (selectedModel) {
				await vscode.workspace.getConfiguration("nvidiaCopilot")
					.update("model", selectedModel, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Modelo atualizado para: ${selectedModel}`);
			}

		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Erro ao buscar modelos: ${msg}`);
		}
	});

	context.subscriptions.push(listModelsDisposable);

	// Comando para configurar a API key de forma segura
	let setKeyDisposable = vscode.commands.registerCommand('nvidia.setApiKey', async () => {
		const key = await vscode.window.showInputBox({
			prompt: "Digite sua NVIDIA API Key",
			password: true,
			ignoreFocusOut: true
		});
		if (key) {
			await context.secrets.store("nvidiaApiKey", key);
			vscode.window.showInformationMessage("API Key salva com segurança!");
		}
	});

	context.subscriptions.push(setKeyDisposable);
}

export function deactivate() { }