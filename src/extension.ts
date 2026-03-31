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
			prompt: "Ask something about your code"
		});

		if (!userInput) {
			return;
		}

		if (!apiKey || apiKey.trim() === "") {
			vscode.window.showErrorMessage('NVIDIA API key is not configured in nvidiaCopilot.apiKey');
			return;
		}

		try {
			const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
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
							content: `Question: ${userInput}` +
								(documentText ? `\n\nFull file:\n${documentText}` : "") +
								(selectedText ? `\n\nSelected text:\n${selectedText}` : "")
						}
					]
				})
			});

			if (!response.ok) {
				const text = await response.text();
				vscode.window.showErrorMessage(`NVIDIA API Error: ${response.status} ${response.statusText} - ${text}`);
				return;
			}

			const data = await response.json() as NvidiaResponse;
			const reply = data?.choices?.[0]?.message?.content;

			if (!reply) {
				vscode.window.showErrorMessage('Invalid response from NVIDIA API (no choices).');
				return;
			}

			vscode.window.showInformationMessage(reply);
		} catch (error) {
			vscode.window.showErrorMessage(`Error: ${error}`);
			console.error("Chat error:", error);
		}
	});

	context.subscriptions.push(disposable);

	let listModelsDisposable = vscode.commands.registerCommand('nvidia.listModels', async () => {
		const config = vscode.workspace.getConfiguration("nvidiaCopilot");
		const apiKey = config.get<string>("apiKey");

		if (!apiKey || apiKey.trim() === "") {
			vscode.window.showErrorMessage('NVIDIA API key is not configured in nvidiaCopilot.apiKey');
			return;
		}

		try {
			console.log("Fetching models from API...");

			const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
				method: "GET",
				headers: {
					"Authorization": `Bearer ${apiKey}`,
					"Accept": "application/json",
					"Content-Type": "application/json"
				},
				signal: AbortSignal.timeout(10000) // 10s timeout
			});

			console.log("Models API response:", response.status);

			if (!response.ok) {
				const text = await response.text();
				vscode.window.showErrorMessage(`Error fetching models: ${response.status} ${response.statusText} - ${text}`);
				return;
			}

			const data = await response.json() as NvidiaModelsResponse;
			const models = data.data.map(model => model.id);

			console.log("Available models:", models);

			const selectedModel = await vscode.window.showQuickPick(models, {
				placeHolder: 'Select a NVIDIA model'
			});

			if (selectedModel) {
				await config.update("model", selectedModel, vscode.ConfigurationTarget.Global);
				vscode.window.showInformationMessage(`Model updated to: ${selectedModel}`);
			}
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			vscode.window.showErrorMessage(`Error fetching models: ${errorMsg}`);
			console.error("Models fetch error:", error);
		}
	});

	context.subscriptions.push(listModelsDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }
