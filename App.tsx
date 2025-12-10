import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ResumeOptimizer from './components/ResumeOptimizer';
import JobFinder from './components/JobFinder';
import InterviewCoach from './components/InterviewCoach';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.RESUME_OPTIMIZER);
  
  // Shared State (The "Brain" of the application)
  const [sharedResumeText, setSharedResumeText] = useState<string>('');
  const [sharedAnalysis, setSharedAnalysis] = useState<string>('');

  const renderContent = () => {
    switch (currentView) {
      case AppView.RESUME_OPTIMIZER:
        return (
          <ResumeOptimizer 
            onAnalysisComplete={(text, analysis) => {
              setSharedResumeText(text);
              setSharedAnalysis(analysis);
            }} 
          />
        );
      case AppView.JOB_FINDER:
        return <JobFinder resumeContext={sharedResumeText} />;
      case AppView.INTERVIEW_PREP:
        return (
          <div className="max-w-4xl mx-auto w-full h-[600px] md:h-[800px] p-4">
            <InterviewCoach resumeContext={sharedResumeText} />
          </div>
        );
      default:
        return <ResumeOptimizer onAnalysisComplete={() => {}} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 md:hidden flex items-center px-4 justify-between shrink-0">
             <span className="font-bold text-slate-800">Recruiter AI</span>
        </header>
        
        <div className="flex-1 overflow-y-auto w-full">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;