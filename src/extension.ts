import * as vscode from 'vscode';

type NvidiaResponse = {
	choices: {
		message: {
			content: string;
		};
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
}

// This method is called when your extension is deactivated
export function deactivate() { }
