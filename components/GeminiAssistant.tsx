
import React, { useState } from 'react';
import { getVeterinaryAdvice } from '../services/geminiService';
import { Cow } from '../types';

interface GeminiAssistantProps {
  currentCow?: Cow;
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ currentCow }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const advice = await getVeterinaryAdvice(currentCow, query);
    setResponse(advice || 'Não foi possível obter resposta.');
    setLoading(false);
  };

  return (
    <>
      {/* Botão Flutuante (Bolinha) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-green-700 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-green-800 transition-all active:scale-90 border-2 border-white"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Interface do Assistente */}
      {isOpen && (
        <div className="fixed bottom-40 right-6 left-6 md:left-auto md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[70vh]">
            <div className="bg-green-800 p-4 text-white">
              <h3 className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Assistente VimaControl
              </h3>
              <p className="text-[10px] text-green-100 opacity-80 uppercase font-medium">IA Veterinária Especializada</p>
            </div>

            <div className="p-4 overflow-y-auto bg-stone-50 flex-1 flex flex-col gap-4">
              {response ? (
                <div className="p-3 bg-white rounded-2xl border border-green-100 text-sm text-stone-700 leading-relaxed shadow-sm animate-in fade-in">
                  <div className="font-bold text-green-700 text-[10px] uppercase mb-1">Doutor IA diz:</div>
                  {response}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-stone-400 text-xs italic">Como posso ajudar com o manejo do seu rebanho hoje?</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mt-auto">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={currentCow ? `Dúvida sobre ${currentCow.name}?` : "Pergunta sobre manejo?"}
                  className="w-full p-3 rounded-2xl border border-stone-300 text-sm focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none bg-white"
                />
                <button
                  onClick={handleAsk}
                  disabled={loading}
                  className="bg-green-700 text-white font-bold py-3 px-4 rounded-xl hover:bg-green-800 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Analisando...
                    </>
                  ) : 'Consultar Veterinário IA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiAssistant;
