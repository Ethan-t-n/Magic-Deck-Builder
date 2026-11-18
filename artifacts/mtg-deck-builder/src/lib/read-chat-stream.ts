/** Read complete SSE events, including a final event without a trailing newline. */
export async function readChatStream(response: Response, onContent: (text: string) => void): Promise<string> {
  if (!response.body) throw new Error("The server returned no response stream.");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let complete = false;
  function processLine(line: string) {
    if (!line.startsWith("data:")) return;
    const raw = line.slice(5).trim();
    if (!raw) return;
    let event: { content?: string; error?: string; done?: boolean };
    try { event = JSON.parse(raw); }
    catch { throw new Error("The server sent an invalid chat response. Please try again."); }
    if (event.error) throw new Error(event.error);
    if (typeof event.content === "string") {
      content += event.content;
      onContent(content);
    }
    if (event.done) complete = true;
  }
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value, { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) processLine(line);
      if (done) {
        if (buffer) processLine(buffer);
        break;
      }
    }
    if (!complete) throw new Error("The connection ended before the answer finished. Please try again.");
    if (!content.trim()) throw new Error("The model returned an empty answer. Please try a short question.");
    return content;
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
