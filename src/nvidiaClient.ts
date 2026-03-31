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

export async function complete(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            stream: false,
            max_tokens: 64,
            stop: ["\n", "```"]
        })
    });

    if (!response.ok) {
        throw new Error(`NVIDIA API Error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.choices?.[0]?.message?.content || "";
}

export async function getEmbeddings(apiKey: string, input: string | string[]): Promise<number[][]> {
    const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "nvidia/llama-3.2-nv-embedqc-1b-v1", // Using a standard NVIDIA embedding NIM
            input: Array.isArray(input) ? input : [input],
            input_type: "query",
            encoding_format: "float"
        })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`NVIDIA Embeddings Error: ${response.status} - ${text}`);
    }

    const data = await response.json() as any;
    return data.data.map((item: any) => item.embedding);
}