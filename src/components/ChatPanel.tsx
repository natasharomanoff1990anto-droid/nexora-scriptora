import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "@/types/book";
import { Send, Loader2 } from "lucide-react";

interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (message: string) => void;
  isGenerating: boolean;
}

export function ChatPanel({ messages, onSend, isGenerating }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p className="mb-1">Welcome to Scriptora ✍️</p>
            <p className="text-xs">Configure your book and start generating, or type a message.</p>
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.role === "system"
                  ? "bg-surface text-muted-foreground italic border border-border"
                  : "bg-surface text-foreground border border-border"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={isGenerating}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
