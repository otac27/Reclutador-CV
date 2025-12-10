import React, { useState, useRef, useEffect } from 'react';
import { createInterviewChat } from '../services/gemini';
import { Message } from '../types';
import { MessageSquare, User, Mic, Send, Loader2, Bot } from 'lucide-react';
import { Chat, GenerateContentResponse } from '@google/genai';

const InterviewCoach: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '¡Hola! Soy tu Coach de Entrevistas AI. ¿Para qué rol te gustaría practicar hoy? (Ej: Desarrollador Java Senior, Gerente de Ventas, Asistente Administrativo, etc.)',
      timestamp: Date.now()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize chat session on mount
    chatRef.current = createInterviewChat();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !chatRef.current || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const responseStream = await chatRef.current.sendMessageStream({ message: userMsg.content });
      
      let fullText = '';
      const botMsgId = (Date.now() + 1).toString();
      
      // Add placeholder message
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of responseStream) {
         const c = chunk as GenerateContentResponse;
         if (c.text) {
             fullText += c.text;
             setMessages(prev => prev.map(msg => 
                msg.id === botMsgId ? { ...msg, content: fullText } : msg
             ));
         }
      }

    } catch (error) {
      console.error("Chat error", error);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          content: "Lo siento, hubo un error de conexión con el servicio. Por favor intenta de nuevo.",
          timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="bg-white p-4 border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
        <div className="bg-indigo-100 p-2 rounded-lg">
            <Bot className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
            <h2 className="font-bold text-slate-800">Simulador de Entrevista (STAR)</h2>
            <p className="text-xs text-slate-500">Practica respuestas conductuales en un entorno seguro</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
              }`}
            >
              <div className="flex items-center gap-2 mb-1 opacity-80 text-xs">
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                <span className="font-semibold">{msg.role === 'user' ? 'Tú' : 'Recruiter AI'}</span>
              </div>
              <div className="whitespace-pre-wrap leading-relaxed text-sm">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-slate-400">Escribiendo feedback...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder-slate-400"
            placeholder="Escribe tu respuesta aquí..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default InterviewCoach;
