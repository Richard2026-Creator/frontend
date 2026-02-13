import React from 'react';
import { View, LibraryImage } from '../types';

interface HomeProps {
  library: LibraryImage[];
  minRequired: number;
  setView: (view: View) => void;
  clientName: string;
  setClientName: (name: string) => void;
}

export const Home: React.FC<HomeProps> = ({ library, minRequired, setView, clientName, setClientName }) => {
  const activePool = library.filter(img => img.isActive !== false);
  const poolSize = activePool.length;
  
  const isEnabled = poolSize >= minRequired;
  const progress = Math.min(100, (poolSize / minRequired) * 100);
  const remaining = Math.max(0, minRequired - poolSize);

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] px-10 text-center animate-in fade-in duration-1000">
      <h1 className="serif text-4xl md:text-5xl font-medium tracking-tight mb-6 text-stone-900 border-b border-[#D4AF37] pb-1 inline-block">
        IMPRINT
      </h1>
      <p className="text-[#7d776d] text-lg leading-relaxed max-w-xs mb-12">
        Explore your vision through instinctive visual selection.
      </p>

      {/* Personalization Section */}
      <div className="w-full max-w-sm mb-16 space-y-2">
        <label className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#a39e93]">
          Created for
        </label>
        <input
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="Client name..."
          className="w-full bg-transparent border-b border-[#dfd9ce] py-2 text-center serif text-2xl outline-none focus:border-[#3d3935] transition-colors placeholder:opacity-20 placeholder:italic"
        />
      </div>

      <div className="w-full max-w-sm">
        <button
          disabled={!isEnabled}
          onClick={() => setView('DISCOVERY')}
          className={`w-full py-5 px-8 rounded-full text-xs font-bold tracking-[0.2em] uppercase transition-all duration-500 ${
            isEnabled 
              ? 'bg-[#3d3935] text-[#f4f1ea] active:scale-95 shadow-xl' 
              : 'bg-[#ede8df] text-[#a39e93] cursor-not-allowed'
          }`}
        >
          Begin Discovery
        </button>

        {/* Readiness Progress Bar */}
        <div className="mt-12 space-y-3">
          <div className="flex justify-between items-end text-[9px] uppercase tracking-[0.4em] font-bold text-[#a39e93]">
            <span>Pool Readiness</span>
            <span className={isEnabled ? 'text-[#3d3935]' : ''}>
              {poolSize} / {minRequired}
            </span>
          </div>
          <div className="h-[2px] w-full bg-[#ede8df] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#3d3935] transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {!isEnabled && (
            <p className="text-[10px] text-[#7d776d] italic">
              Include {remaining} more images in the discovery pool via Studio Settings.
            </p>
          )}
          {isEnabled && (
            <p className="text-[10px] text-[#3d3935] font-bold uppercase tracking-widest opacity-20">
              {poolSize} Images ready for discovery
            </p>
          )}
        </div>
      </div>
    </div>
  );
};