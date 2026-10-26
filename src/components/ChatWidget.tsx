import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Simple floating chat widget that talks to the FastAPI /chat/message endpoint
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Ensure portal container exists
  useEffect(() => {
    const div = document.createElement("div");
    document.body.appendChild(div);
    containerRef.current = div;
    return () => {
      if (containerRef.current) document.body.removeChild(containerRef.current);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setInput("");
    try {
      const response = await fetch("http://127.0.0.1:8001/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.content }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader!.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.role === "assistant") {
              const updated = { ...last, content: last.content + chunk };
              return [...prev.slice(0, -1), updated];
            }
            return [...prev, { role: "assistant", content: chunk }];
          });
        }
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "assistant", content: "Error communicating with bot." }]);
    } finally {
      setLoading(false);
    }
  };

  if (!containerRef.current) return null;

  return createPortal(
    <div style={{ position: "fixed", bottom: "20px", right: "20px", zIndex: 1000 }}>
      {/* Chat button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "#2d3748",
          color: "white",
          borderRadius: "9999px",
          width: "56px",
          height: "56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
      >💬</button>

      {open && (
        <div
          style={{
            marginTop: "8px",
            width: "320px",
            maxHeight: "480px",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden"
          }}
        >
          <div style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: "6px", textAlign: msg.role === "user" ? "right" : "left" }}>
                <span
                  style={
                    msg.role === "user"
                      ? { background: "#2563eb", color: "white", padding: "4px 8px", borderRadius: "6px" }
                      : { background: "#f1f5f9", color: "#1a202c", padding: "4px 8px", borderRadius: "6px" }
                  }
                >
                  {msg.content}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", borderTop: "1px solid #e2e8f0" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
              disabled={loading}
              placeholder="Type a message…"
              style={{ flex: 1, padding: "8px", border: "none", outline: "none" }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{ background: "#2563eb", color: "white", border: "none", padding: "0 12px" }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>,
    containerRef.current
  );
}
