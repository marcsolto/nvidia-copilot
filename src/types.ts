export type NvidiaResponse = {
	choices: { message: { content: string } }[];
};

export type NvidiaModelsResponse = {
	data: { id: string; object: string; created: number; owned_by: string }[];
};

export type Message = { role: "system" | "user" | "assistant"; content: string };