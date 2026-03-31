export async function chat(apiKey: string, model: string, messages: any[], onToken?: (token: string) => void) {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            messages,
            stream: true
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`NVIDIA API Error: ${response.status} ${response.statusText} - ${text}`);
    }

    if (!response.body) {
        throw new Error("No response body received from NVIDIA API");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let fullText = "";

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n").filter(line => line.trim() !== "");

            for (const line of lines) {
                if (line.includes("[DONE]")) {
                    break;
                }
                if (!line.startsWith("data: ")) {
                    continue;
                }

                const jsonStr = line.substring(6);
                try {
                    const parsed = JSON.parse(jsonStr);
                    const token = parsed.choices?.[0]?.delta?.content;
                    if (token) {
                        fullText += token;
                        if (onToken) {
                            onToken(token);
                        }
                    }
                } catch (e) {
                    console.warn("Failed to parse JSON chunk", jsonStr);
                }
            }
        }
    } finally {
        reader.releaseLock();
    }

    return fullText;
}