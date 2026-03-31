import * as vscode from 'vscode';

export function getApiKey(): string | undefined {
	const config = vscode.workspace.getConfiguration("nvidiaCopilot");
	const key = config.get<string>("apiKey");
	return key?.trim() || undefined;
}

export function getModel(): string {
	const config = vscode.workspace.getConfiguration("nvidiaCopilot");
	return config.get<string>("model") || "meta/llama3-70b-instruct";
}