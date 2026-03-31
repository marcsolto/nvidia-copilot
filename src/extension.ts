import * as vscode from 'vscode';
import { chat } from './nvidiaClient';
import { addUserMessage, addAssistantMessage, getMessages } from './chatHistory';
import { getApiKey, getModel } from './config';
import { Message } from './types';
import { createChatPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext) {

	// Comando principal: abrir chat e perguntar à IA
	let disposable = vscode.commands.registerCommand('nvidia.copilot', async () => {
		const apiKey = getApiKey();
		const model = getModel();

		if (!apiKey) {
			vscode.window.showErrorMessage('Configure sua NVIDIA API Key em Settings: nvidiaCopilot.apiKey');
			return;
		}

		const userInput = await vscode.window.showInputBox({
			prompt: "Pergunte algo sobre seu código"
		});
		if (!userInput) return;

		// Adicionar pergunta do usuário ao histórico
		addUserMessage(userInput);

		// Criar ou reutilizar painel de chat
		let panel = vscode.window.activeTextEditor?.document.languageId === 'markdown'
			? createChatPanel()
			: vscode.window.createWebviewPanel("nvidiaChat", "NVIDIA Chat", vscode.ViewColumn.Beside, { enableScripts: true });

		let fullText = "";

		// Ler streaming da IA
		try {
			let fullText = "";

			await chat(apiKey, model, getMessages(), (token: string) => {
				fullText += token;
				panel.webview.postMessage({ type: 'update', content: fullText });
			});

			// Salvar resposta da IA no histórico
			addAssistantMessage(fullText);

		} catch (error) {
			const msg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Erro na NVIDIA API: ${msg}`);
			console.error("Streaming chat error:", error);
		}
	});

	context.subscriptions.push(disposable);

	// Comando para listar modelos disponíveis
	let listModelsDisposable = vscode.commands.registerCommand('nvidia.listModels', async () => {
		const apiKey = getApiKey();
		if (!apiKey) {
			vscode.window.showErrorMessage('Configure sua NVIDIA API Key em Settings: nvidiaCopilot.apiKey');
			return;
		}

		try {
			const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${apiKey}`,
					"Accept": "application/json",
					"Content-Type": "application/json"
				},
				signal: AbortSignal.timeout(10000)
			});

			if (!response.ok) {
				const text = await response.text();
				vscode.window.showErrorMessage(`Erro ao buscar modelos: ${response.status} ${response.statusText} - ${text}`);
				return;
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
			console.error("Model fetch error:", error);
		}
	});

	context.subscriptions.push(listModelsDisposable);

	// Comando para configurar a API key
	let setKeyDisposable = vscode.commands.registerCommand('nvidia.setApiKey', async () => {
		const key = await vscode.window.showInputBox({
			prompt: "Digite sua NVIDIA API Key",
			password: true
		});
		if (key) {
			await context.secrets.store("nvidiaApiKey", key);
			await vscode.workspace.getConfiguration("nvidiaCopilot")
				.update("apiKey", key, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage("API Key salva com sucesso!");
		}
	});

	context.subscriptions.push(setKeyDisposable);
}

export function deactivate() { }