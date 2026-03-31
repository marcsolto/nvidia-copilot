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
				padding: 0;
				margin: 0;
				display: flex;
				flex-direction: column;
				height: 100vh;
				color: var(--vscode-editor-foreground);
				background-color: var(--vscode-editor-background);
			}
			#chat-container {
				flex: 1;
				overflow-y: auto;
				padding: 10px;
				display: flex;
				flex-direction: column;
				gap: 10px;
			}
			.message {
				padding: 8px 12px;
				border-radius: 6px;
				max-width: 90%;
				line-height: 1.4;
				word-wrap: break-word;
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
			#input-container {
				padding: 10px;
				border-top: 1px solid var(--vscode-panel-border);
				display: flex;
				gap: 10px;
				background-color: var(--vscode-editor-background);
			}
			#user-input {
				flex: 1;
				background-color: var(--vscode-input-background);
				color: var(--vscode-input-foreground);
				border: 1px solid var(--vscode-input-border);
				padding: 8px;
				resize: none;
				font-family: inherit;
				border-radius: 4px;
			}
			#send-button {
				background-color: var(--vscode-button-background);
				color: var(--vscode-button-foreground);
				border: none;
				padding: 8px 16px;
				cursor: pointer;
				border-radius: 4px;
				font-weight: bold;
			}
			#send-button:hover {
				background-color: var(--vscode-button-hoverBackground);
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
		<div id="chat-container">
			<div class="message assistant">🤖 Hello! I'm your NVIDIA Copilot. How can I help you?</div>
		</div>
		<div id="input-container">
			<textarea id="user-input" rows="1" placeholder="Type your message..."></textarea>
			<button id="send-button">Send</button>
		</div>
		<script>
			const vscode = acquireVsCodeApi();
			const chatContainer = document.getElementById('chat-container');
			const userInput = document.getElementById('user-input');
			const sendButton = document.getElementById('send-button');

			const markedOptions = {
				gfm: true,
				breaks: true
			};
			
			let currentAssistantMessageDiv = null;

			function addMessage(content, isUser) {
				const msgDiv = document.createElement('div');
				msgDiv.className = 'message ' + (isUser ? 'user' : 'assistant');
				msgDiv.innerHTML = marked.parse(content, markedOptions);
				chatContainer.appendChild(msgDiv);
				chatContainer.scrollTop = chatContainer.scrollHeight;
				return msgDiv;
			}

			function sendMessage() {
				const text = userInput.value.trim();
				if (text) {
					addMessage(text, true);
					vscode.postMessage({ type: 'userMessage', value: text });
					userInput.value = '';
					userInput.style.height = 'auto';
				}
			}

			sendButton.addEventListener('click', sendMessage);
			userInput.addEventListener('keydown', e => {
				if (e.key === 'Enter' && !e.shiftKey) {
					e.preventDefault();
					sendMessage();
				}
			});

			// Auto-resize textarea
			userInput.addEventListener('input', () => {
				userInput.style.height = 'auto';
				userInput.style.height = (userInput.scrollHeight) + 'px';
			});

			window.addEventListener('message', event => {
				const { type, content, isUser } = event.data;

				if (type === 'update') {
					if (!currentAssistantMessageDiv) {
						currentAssistantMessageDiv = document.createElement('div');
						currentAssistantMessageDiv.className = 'message assistant';
						chatContainer.appendChild(currentAssistantMessageDiv);
					}
					currentAssistantMessageDiv.innerHTML = marked.parse(content, markedOptions);
					chatContainer.scrollTop = chatContainer.scrollHeight;
				} else if (type === 'addMessage') {
					const msgDiv = addMessage(content, isUser);
					if (!isUser) {
						currentAssistantMessageDiv = msgDiv;
					} else {
						currentAssistantMessageDiv = null;
					}
				}
			});
		</script>
	</body>
	</html>
	`;
}