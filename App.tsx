
import React from 'react';
import CameraView from './components/CameraView';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-emerald-500/30">
      {/* Decorative gradient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-900/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/10 blur-[120px] rounded-full" />
      </div>

      <main className="relative z-10">
        <CameraView />
      </main>

      {/* Persistent Call-to-Action / Info Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 border-t border-white/5 bg-black/40 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              VF
            </div>
            <div>
              <p className="text-zinc-100 text-sm font-semibold leading-tight">VisionFlow Enterprise Core</p>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Client-Side Biometric Engine</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-400 hover:text-zinc-100 text-xs transition-colors">Documentation</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-100 text-xs transition-colors">API Keys</a>
            <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded-full hover:bg-emerald-400 transition-colors shadow-xl">
              Integrate Library
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
