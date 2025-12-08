import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubbleLeftRightIcon, ShieldCheckIcon, ExclamationTriangleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { getGeminiResponse } from '../lib/gemini';

type Message = {
  id: number;
  role: 'bot' | 'user';
  text: string;
  options?: string[];
};

const SymptomChecker = () => {
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Internal state to track if AI is thinking
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');

  // The chat history
  const [history, setHistory] = useState<Message[]>([
    {
      id: 1,
      role: 'bot',
      text: "Hello. I am the MediLink AI Assistant. I can help you decide if you need to see a doctor. What is your main symptom?",
      options: ['Headache', 'Fever', 'Stomach Pain', 'Cough / Flu']
    }
  ]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User Response
    const userMsg: Message = { id: Date.now(), role: 'user', text: text };
    const updatedHistory = [...history, userMsg];
    setHistory(updatedHistory);
    setInputText(''); // Clear input if it was used
    setIsLoading(true);

    // Handle immediate navigation for specific options
    if (text === 'Book Now') {
      navigate('/appointments');
      return;
    }
    if (text === 'No thanks' || text === 'Back to Dashboard') {
      navigate('/dashboard');
      return;
    }

    // 2. Get AI Response
    // Convert our Message type to the Gemini ChatMessage type
    const apiHistory = updatedHistory.map(h => ({
      role: h.role === 'bot' ? 'model' : 'user',
      parts: h.text
    })) as any[]; // Type assertion for simplicity in this context

    const response = await getGeminiResponse(apiHistory, text);

    const botMsg: Message = {
      id: Date.now() + 1,
      role: 'bot',
      text: response.text,
      options: response.options
    };

    setHistory(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputText);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-20">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheckIcon className="h-8 w-8 text-primary" />
          AI Symptom Checker
        </h1>
        <p className="text-slate-500 text-sm">An automated triage system to save you time.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden min-h-[500px] flex flex-col">

        {/* Chat Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/50 max-h-[500px]">
          {history.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>

                {/* Avatar */}
                <div className={`h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'bot' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {msg.role === 'bot' ? <ShieldCheckIcon className="h-5 w-5" /> : <ChatBubbleLeftRightIcon className="h-5 w-5" />}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl text-sm shadow-sm ${msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                  }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-8 w-8 rounded-full flex-shrink-0 flex items-center justify-center bg-primary text-white animate-pulse">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <div className="p-4 rounded-2xl text-sm shadow-sm bg-white text-slate-500 border border-slate-200 rounded-tl-none italic">
                  Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Options Area (Dynamic Buttons) */}
        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">

          {/* Quick Options (Chips) */}
          {history[history.length - 1].role === 'bot' && history[history.length - 1].options && (
            <div className="flex flex-wrap gap-2 mb-4">
              {history[history.length - 1].options?.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleSend(opt)}
                  className="px-4 py-2 rounded-full bg-slate-50 border border-slate-200 text-slate-600 text-sm font-medium hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="relative flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your symptoms..."
              className="flex-1 pl-4 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all"
              disabled={isLoading}
              aria-label="Describe your symptoms"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-3 flex items-center justify-center gap-1">
            <ExclamationTriangleIcon className="h-3 w-3" />
            Not for emergencies. Call 999 if urgent.
          </p>
        </div>

      </div>
    </div>
  );
};

export default SymptomChecker;