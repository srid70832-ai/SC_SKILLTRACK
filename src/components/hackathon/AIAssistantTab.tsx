import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, Send, Copy, Check, Bot, User, Trash2, 
  RotateCcw, Square, Lightbulb, Code2, BookOpen, 
  Presentation, FileText, Zap, Compass, Share2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

const QUICK_PROMPTS = [
  { label: 'Educational: What is Bird?', prompt: 'What is bird? Explain its biological characteristics, evolutionary origin, and ecological role.' },
  { label: 'Explain CNN Architecture', prompt: 'Explain Convolutional Neural Networks (CNN) with a simple layer-by-layer breakdown and real-world computer vision applications.' },
  { label: 'Generate AI Project Idea', prompt: 'Generate 3 innovative, high-impact AI project ideas for Smart India Hackathon with architecture, tech stack, and USP.' },
  { label: '10-Slide Pitch Deck', prompt: 'Create a 10-slide jury pitch deck outline for an AI healthcare triage application.' },
  { label: 'Write Production Code', prompt: 'Write a production-ready Express.js API route with rate limiting, input validation, and async error handling.' },
  { label: 'Startup Revenue Model', prompt: 'Create a B2B SaaS business model, pricing strategy, and GTM strategy for an automated legal document AI tool.' },
  { label: 'Jury Q&A Preparation', prompt: 'Predict 5 difficult technical questions a hackathon jury might ask about a real-time deepfake detection system and provide winning answers.' }
];

export default function AIAssistantTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `👋 **Hello! I am SC AI Copilot, powered by Gemini.**

I am your intelligent assistant. You can ask me **anything**—from general educational questions (*"What is bird?"*, *"Explain quantum computing"*) to writing production code, generating hackathon project ideas, reviewing pitch decks, or building startup business models!

**How can I assist you today?**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isGenerating]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputPrompt).trim();
    if (!textToSend || isGenerating) return;

    if (!customPrompt) {
      setInputPrompt('');
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: textToSend,
      timestamp: nowTime
    };

    const newAssistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: nowTime,
      isStreaming: true
    };

    const updatedHistory = [...messages, newUserMsg];
    setMessages([...updatedHistory, newAssistantMsg]);
    setIsGenerating(true);

    // Abort controller for Stop Generation feature
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Send conversation history to backend streaming SSE endpoint
      const apiMessages = updatedHistory.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch('/api/hackathon/ai-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: apiMessages,
          prompt: textToSend
        })
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                streamedContent += parsed.text;
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: streamedContent }
                      : msg
                  )
                );
              }
            } catch (e) {
              // Ignore partial JSON parse errors in chunk stream
            }
          }
        }
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMsgId
            ? { ...msg, isStreaming: false }
            : msg
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation stopped by user.');
      } else {
        console.error('AI Stream Error:', err);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: msg.content || 'An error occurred while communicating with Gemini API.',
                  isStreaming: false
                }
              : msg
          )
        );
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      setMessages(prev =>
        prev.map(msg => ({ ...msg, isStreaming: false }))
      );
    }
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMessage) {
      handleSend(lastUserMessage.content);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Clear entire conversation history?')) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `👋 **Chat cleared! I am SC AI Copilot.**\n\nHow can I help you next?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[600px] bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Copilot Bar */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                SC AI Copilot
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Intelligent Full-Spectrum AI • Code • Education • Hackathons • Strategy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              onClick={handleClearHistory}
              title="Clear Chat History"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Prompt Category Chips */}
      <div className="px-6 py-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Compass className="w-3.5 h-3.5" /> Prompt Starters:
        </span>
        {QUICK_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.prompt)}
            disabled={isGenerating}
            className="px-3 py-1 rounded-full bg-slate-800/90 hover:bg-amber-500/20 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 border border-slate-700 text-xs font-medium whitespace-nowrap transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-5 shadow-lg space-y-2 border ${
                  isUser
                    ? 'bg-amber-600 text-white border-amber-500 rounded-tr-none'
                    : 'bg-slate-800/90 text-slate-100 border-slate-700/80 rounded-tl-none'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-white/10 pb-2 mb-2">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    {isUser ? (
                      <>
                        <User className="w-3.5 h-3.5 text-amber-200" /> You
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> SC AI Copilot
                      </>
                    )}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                {/* Content Rendering */}
                <div className="prose prose-invert prose-sm max-w-none text-slate-100 leading-relaxed overflow-x-auto">
                  {msg.content ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : msg.isStreaming ? (
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium py-1 animate-pulse">
                      <Sparkles className="w-4 h-4 animate-spin" />
                      Thinking and generating response...
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No output received.</span>
                  )}
                </div>

                {/* Bottom Action Bar for Assistant Messages */}
                {!isUser && msg.content && (
                  <div className="pt-2 border-t border-slate-700/50 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => handleCopyText(msg.id, msg.content)}
                      className="px-2.5 py-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Response</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white shrink-0 shadow-md">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
              )}
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Control Bar */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex flex-col gap-2"
        >
          <div className="relative flex items-center bg-slate-900 border border-slate-800 focus-within:border-amber-500 rounded-xl p-1 shadow-inner">
            <textarea
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything (e.g., 'What is bird?', 'Explain CNN', 'Generate AI project', 'Write Python code')..."
              className="flex-1 bg-transparent px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none resize-none"
            />

            <div className="flex items-center gap-2 pr-2">
              {isGenerating ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputPrompt.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">Shift + Enter</kbd> for new line</span>

            {messages.length > 2 && !isGenerating && (
              <button
                type="button"
                onClick={handleRegenerate}
                className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> Regenerate last response
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
