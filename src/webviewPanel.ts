import * as vscode from 'vscode';

export function createChatPanel(): vscode.WebviewPanel {
	const panel = vscode.window.createWebviewPanel(
		"nvidiaChat",
		"NVIDIA Chat",
		vscode.ViewColumn.Beside,
		{ enableScripts: true }
	);

	// Conteúdo inicial do chat (vazio, mas com placeholder)
	panel.webview.html = `
	<html>
	<body>
		<h2>NVIDIA Chat</h2>
		<div id="chat" style="white-space: pre-wrap; border: 1px solid #ccc; padding: 8px; height: 400px; overflow-y: auto;">
		🤖 Chat iniciado. Digite sua pergunta no comando "Ask NVIDIA Copilot".
		</div>
		<script>
			const chat = document.getElementById('chat');
			window.addEventListener('message', event => {
				if(event.data.type === 'update') {
					chat.innerText = event.data.content;
					chat.scrollTop = chat.scrollHeight; // rola automático
				}
			});
		</script>
	</body>
	</html>
	`;

	return panel;
}