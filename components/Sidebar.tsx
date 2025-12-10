import React from 'react';
import { AppView } from '../types';
import { FileText, Search, MessageSquare, Briefcase } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: AppView.RESUME_OPTIMIZER, label: 'Optimizar CV', icon: FileText },
    { id: AppView.JOB_FINDER, label: 'Buscar Empleo', icon: Search },
    { id: AppView.INTERVIEW_PREP, label: 'Simulador Entrevista', icon: MessageSquare },
  ];

  return (
    <div className="w-full md:w-64 bg-slate-900 text-white flex flex-col h-auto md:h-full flex-shrink-0 transition-all">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-indigo-600 p-2 rounded-lg">
             <Briefcase className="w-6 h-6 text-white" />
        </div>
        <div>
            <h1 className="text-lg font-bold tracking-tight">Recruiter AI</h1>
            <p className="text-xs text-slate-400">Asistente Experto</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-x-auto md:overflow-visible flex md:flex-col">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all duration-200 group whitespace-nowrap md:whitespace-normal
                ${isActive 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 hidden md:block">
        <div className="bg-slate-800/50 rounded-xl p-4 text-xs text-slate-400">
            <p className="mb-2">Desarrollado con Gemini 2.5</p>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full w-3/4 rounded-full"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
