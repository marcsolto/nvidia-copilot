import * as vscode from 'vscode';

type NvidiaResponse = {
	choices: {
		message: {
			content: string;
		};
	}[];
};

type NvidiaModelsResponse = {
	data: {
		id: string;
		object: string;
		created: number;
		owned_by: string;
	}[];
};

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('nvidia.copilot', async () => {

		const editor = vscode.window.activeTextEditor;
		const documentText = editor?.document.getText();
		const selectedText = editor?.document.getText(editor.selection);

		const config = vscode.workspace.getConfiguration("nvidiaCopilot");
		const apiKey = config.get<string>("apiKey");
		const model = config.get<string>("model") || "meta/llama3-70b-instruct";

		const userInput = await vscode.window.showInputBox({
			prompt: "Pergunte algo sobre seu código"
		});

		if (!userInput) {
			return;
		}

		if (!apiKey || apiKey.trim() === "") {
			vscode.window.showErrorMessage('NVIDIA API key não está configurada em nvidiaCopilot.apiKey');
			return;
		}

		const response = await fetch("https://api.nvidia.com/v1/chat/completions", {
			method: "POST",
			headers: {
				"Authorization": `Bearer ${apiKey}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: "user",
						content: `Pergunta: ${userInput}` +
							(documentText ? `\n\nArquivo inteiro:\n${documentText}` : "") +
							(selectedText ? `\n\nseleção:\n${selectedText}` : "")
					}
				]
			})
		});

		if (!response.ok) {
			const text = await response.text();
			vscode.window.showErrorMessage(`Erro da API NVIDIA: ${response.status} ${response.statusText} - ${text}`);
			return;
		}

		const data = await response.json() as NvidiaResponse;
		const reply = data?.choices?.[0]?.message?.content;

		if (!reply) {
			vscode.window.showErrorMessage('Resposta inválida da API NVIDIA (sem choices).');
			return;
		}

		vscode.window.showInformationMessage(reply);
	});

	context.subscriptions.push(disposable);

	let listModelsDisposable = vscode.commands.registerCommand('nvidia.listModels', async () => {
		const config = vscode.workspace.getConfiguration("nvidiaCopilot");
		const apiKey = config.get<string>("apiKey");

		if (!apiKey || apiKey.trim() === "") {
			vscode.window.showErrorMessage('NVIDIA API key não está configurada em nvidiaCopilot.apiKey');
			return;
		}

		try {
			const response = await fetch("https://api.nvidia.com/v1/models", {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${apiKey}`,
					"Content-Type": "application/json"
				}
			});

			if (!response.ok) {
				const text = await response.text();
				vscode.window.showErrorMessage(`Erro ao buscar modelos: ${response.status} ${response.statusText} - ${text}`);
				return;
			}

			const data = await response.json() as NvidiaModelsResponse;
			const models = data.data.map(model => model.id);

			const selectedModel = await vscode.window.showQuickPick(models, {
				placeHolder: 'Selecione um modelo NVIDIA'
			});

			if (selectedModel) {
				// Atualizar a configuração com o modelo selecionado
				await config.update("model", selectedModel, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Modelo atualizado para: ${selectedModel}`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Erro ao buscar modelos: ${error}`);
		}
	});

	context.subscriptions.push(listModelsDisposable);
}
