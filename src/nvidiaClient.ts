export async function chat(apiKey: string, model: string, messages: any[], onToken?: (token: string) => void) {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true })
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullText = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter(line => line.trim() !== "");
        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.replace("data: ", "");
            if (jsonStr === "[DONE]") break;
            try {
                const parsed = JSON.parse(jsonStr);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                    fullText += token;
                    if (onToken) onToken(token);
                }
            } catch { }
        }
    }
    return fullText;
}