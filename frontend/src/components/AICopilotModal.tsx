import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { api } from '../api/client';

interface AICopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: string) => void;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  actions?: string[];
  source?: string;
}

export const AICopilotModal: React.FC<AICopilotModalProps> = ({ isOpen, onClose, onNavigateTab }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hello! I am your TalentFlow 360 Decision Copilot. Ask me about candidate matching, interview conflict detection, structured scorecards, offer compensation exceptions, or rules R001–R011.',
      actions: [
        'What are the 5 mandatory anomalies?',
        'How does Rule R009 compensation exception work?',
        'Show me scorecard weighted formula'
      ],
      source: 'TalentFlow AI Copilot'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.queryCopilot(textToSend);
      const botMsg: Message = {
        sender: 'assistant',
        text: res.answer,
        actions: res.suggested_actions,
        source: res.source
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `Error connecting to copilot: ${err.message}`,
          source: 'Error'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string) => {
    if (action.includes('Exceptions')) {
      onNavigateTab('exceptions');
      onClose();
    } else if (action.includes('Evaluations') || action.includes('Scorecard')) {
      onNavigateTab('evaluations');
      onClose();
    } else if (action.includes('Requisitions')) {
      onNavigateTab('requisitions');
      onClose();
    } else if (action.includes('Candidates')) {
      onNavigateTab('candidates');
      onClose();
    } else if (action.includes('Audit')) {
      onNavigateTab('audit');
      onClose();
    } else if (action.includes('Settings')) {
      onNavigateTab('settings');
      onClose();
    } else {
      handleSend(action);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col h-[600px] overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-blue-200" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">TalentFlow 360 AI Copilot</h3>
              <p className="text-[11px] text-blue-100">Intelligent Recruitment & Decision Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Trail */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-2xs ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-line">{m.text}</p>
                {m.source && (
                  <span className="block mt-1 text-[10px] text-slate-400 font-semibold">
                    {m.source}
                  </span>
                )}
              </div>

              {/* Action Suggestions */}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 max-w-[85%]">
                  {m.actions.map((act, actIdx) => (
                    <button
                      key={actIdx}
                      onClick={() => handleActionClick(act)}
                      className="text-[10px] font-semibold bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-2.5 py-1 rounded-full shadow-2xs transition flex items-center space-x-1"
                    >
                      <span>{act}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
              <span>Reasoning through recruitment policy rules...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2"
        >
          <input
            type="text"
            placeholder="Ask anything about candidates, rules R001-R011, offers, exceptions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 text-xs border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
