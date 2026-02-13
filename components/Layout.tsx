import React from 'react';
import { Settings, BarChart2 } from 'lucide-react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  setView: (view: View) => void;
  logo: string | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, logo }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#f4f1ea] text-[#3d3935]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#f4f1ea]/80 backdrop-blur-md px-6 pt-12 pb-4 flex justify-between items-center">
        <div 
          className="serif text-xl font-medium tracking-tight cursor-pointer transition-opacity duration-300 text-stone-900 border-b-[0.5px] border-[#D4AF37] pb-0.5"
          onClick={() => setView('HOME')}
          style={{ opacity: currentView === 'HOME' ? 0 : 1, pointerEvents: currentView === 'HOME' ? 'none' : 'auto' }}
        >
          IMPRINT
        </div>
        <div className="flex gap-4 items-center">
          {currentView !== 'SETTINGS' && (
            <button 
              onClick={() => setView('SETTINGS')}
              className="p-2 text-[#7d776d] hover:text-[#3d3935] transition-colors"
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 pt-24 pb-32">
        {children}
      </main>

      {/* Persistent Navigation for Studio */}
      {(currentView === 'SETTINGS' || currentView === 'ANALYTICS') && (
         <footer className="fixed bottom-0 left-0 right-0 bg-[#f4f1ea] border-t border-[#dfd9ce] px-8 py-6 flex justify-around items-center">
            <button 
                onClick={() => setView('SETTINGS')}
                className={`flex flex-col items-center gap-1 ${currentView === 'SETTINGS' ? 'text-[#3d3935]' : 'text-[#a39e93]'}`}
            >
                <Settings size={22} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-widest font-medium">Studio</span>
            </button>
            <button 
                onClick={() => setView('ANALYTICS')}
                className={`flex flex-col items-center gap-1 ${currentView === 'ANALYTICS' ? 'text-[#3d3935]' : 'text-[#a39e93]'}`}
            >
                <BarChart2 size={22} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-widest font-medium">Analytics</span>
            </button>
         </footer>
      )}

      {/* Home Footer Logo */}
      {currentView === 'HOME' && logo && (
        <footer className="fixed bottom-12 left-0 right-0 flex justify-center opacity-80">
           <img src={logo} alt="Studio Logo" className="h-16 w-auto object-contain" />
        </footer>
      )}
    </div>
  );
};