type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** Use Ollama's native thinking switch instead of relying on compatibility aliases. */
export async function ollamaChat(messages: ChatMessage[], model: string, baseURL: string, outputTokens = 8192) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);
  try {
    const response = await fetch(new URL("/api/chat", baseURL), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        messages,
        think: false,
        stream: true,
        keep_alive: "10m",
        options: { temperature: 0.3, repeat_penalty: 1.1, num_predict: outputTokens },
      }),
    });
    if (!response.ok || !response.body) throw new Error("Ollama could not start this response.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    async function* chunks() {
      let buffer = "";
      let completed = false;
      function parse(line: string) {
        const item = JSON.parse(line);
        if (item.error) throw new Error("Ollama reported a generation error.");
        if (item.done) {
          completed = true;
          if (item.done_reason === "length") throw new Error("The model reached its output limit. Try a shorter request.");
        }
        // Reasoning and answers are separate fields. Only forward the answer.
        return { choices: [{ delta: { content: item.message?.content ?? "" } }] };
      }
      try {
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) if (line.trim()) yield parse(line);
          if (done) {
            if (buffer.trim()) yield parse(buffer);
            break;
          }
        }
        if (!completed) throw new Error("Ollama disconnected before completing the response.");
      } finally {
        clearTimeout(timeout);
        controller.abort();
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    }
    return chunks();
  } catch (error) {
    clearTimeout(timeout);
    controller.abort();
    throw error;
  }
}
