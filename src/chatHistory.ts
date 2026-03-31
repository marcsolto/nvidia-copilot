type Message = { role: "system" | "user" | "assistant"; content: string };
let messages: Message[] = [
	{ role: "system", content: "You are a helpful coding assistant." }
];

export function addUserMessage(content: string) {
	messages.push({ role: "user", content });
	trimMessages();
}

export function addAssistantMessage(content: string) {
	messages.push({ role: "assistant", content });
	trimMessages();
}

export function getMessages(): Message[] {
	return messages;
}

function trimMessages() {
	if (messages.length > 20) {
		messages = messages.slice(-20);
	}
}