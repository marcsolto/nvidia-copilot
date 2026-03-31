import * as vscode from 'vscode';

export function createChatPanel(): vscode.WebviewPanel {
	const panel = vscode.window.createWebviewPanel(
		"nvidiaChat",
		"NVIDIA Chat",
		vscode.ViewColumn.Beside,
		{
			enableScripts: true,
			retainContextWhenHidden: true
		}
	);

	panel.webview.html = getWebviewContent();

	return panel;
}

function getWebviewContent(): string {
	return `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
		<style>
			body {
				font-family: var(--vscode-font-family);
				padding: 10px;
				color: var(--vscode-editor-foreground);
				background-color: var(--vscode-editor-background);
			}
			#chat {
				display: flex;
				flex-direction: column;
				gap: 10px;
				padding-bottom: 20px;
			}
			.message {
				padding: 8px 12px;
				border-radius: 6px;
				max-width: 90%;
				line-height: 1.4;
			}
			.user {
				align-self: flex-end;
				background-color: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
			}
			.assistant {
				align-self: flex-start;
				background-color: var(--vscode-editor-inactiveSelectionBackground);
				border: 1px solid var(--vscode-panel-border);
			}
			pre {
				background-color: var(--vscode-textCodeBlock-background);
				padding: 8px;
				overflow-x: auto;
				border-radius: 4px;
			}
			code {
				font-family: var(--vscode-editor-font-family);
			}
		</style>
	</head>
	<body>
		<h2>NVIDIA Copilot</h2>
		<div id="chat">
			<div class="message assistant">🤖 Hello! How can I help with your code today?</div>
		</div>
		<script>
			const chatContainer = document.getElementById('chat');
			const markedOptions = {
				gfm: true,
				breaks: true
			};
			
			let currentAssistantMessage = null;

			window.addEventListener('message', event => {
				const { type, content, isUser } = event.data;

				if (type === 'update') {
					if (!currentAssistantMessage) {
						currentAssistantMessage = document.createElement('div');
						currentAssistantMessage.className = 'message assistant';
						chatContainer.appendChild(currentAssistantMessage);
					}
					currentAssistantMessage.innerHTML = marked.parse(content, markedOptions);
					window.scrollTo(0, document.body.scrollHeight);
				} else if (type === 'addMessage') {
					const msgDiv = document.createElement('div');
					msgDiv.className = 'message ' + (isUser ? 'user' : 'assistant');
					msgDiv.innerHTML = marked.parse(content, markedOptions);
					chatContainer.appendChild(msgDiv);
					if (!isUser) currentAssistantMessage = msgDiv;
					else currentAssistantMessage = null;
					window.scrollTo(0, document.body.scrollHeight);
				}
			});
		</script>
	</body>
	</html>
	`;
}