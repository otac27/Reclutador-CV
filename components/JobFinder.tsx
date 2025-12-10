import React, { useState } from 'react';
import { searchJobs } from '../services/gemini';
import { Search, MapPin, Briefcase, ExternalLink, Loader2 } from 'lucide-react';
import { GroundingChunk } from '../types';

const JobFinder: React.FC = () => {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [results, setResults] = useState<{ text: string, sources: GroundingChunk[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setResults(null);
    
    // Construct query to favor Spanish results if location is generic or implied
    const fullQuery = `${query} ${location ? `en ${location}` : ''}`;
    
    try {
      const data = await searchJobs(fullQuery);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-4">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Buscador de Empleo Inteligente</h2>
        <p className="text-slate-500">Rastrea ofertas reales en la web utilizando Google Search Grounding</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <Briefcase className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Cargo (ej: Gerente de Ventas, Desarrollador Java)"
            className="bg-transparent border-none outline-none w-full text-slate-700 placeholder-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
          <MapPin className="w-5 h-5 text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Ciudad, País o 'Remoto'"
            className="bg-transparent border-none outline-none w-full text-slate-700 placeholder-slate-400"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
        </button>
      </form>

      {/* Results Display */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500">Explorando el mercado laboral...</p>
            </div>
        )}

        {results && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Resultados de la Búsqueda</h3>
               <div className="prose prose-slate max-w-none mb-6 text-slate-600 whitespace-pre-wrap">
                  {results.text}
               </div>
            </div>

            {results.sources.length > 0 && (
              <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-6">
                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Fuentes Verificadas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.sources.map((source, idx) => (
                        source.web && (
                            <a 
                                key={idx} 
                                href={source.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block p-4 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-md transition-all group"
                            >
                                <div className="font-medium text-indigo-700 group-hover:underline truncate">
                                    {source.web.title}
                                </div>
                                <div className="text-xs text-slate-500 mt-1 truncate">
                                    {source.web.uri}
                                </div>
                            </a>
                        )
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobFinder;
