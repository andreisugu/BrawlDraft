import { useState } from 'react';
import { Header } from './components/common/Header';
import { DraftRoom } from './components/draft/DraftRoom';
import { QuizMode } from './components/academy/QuizMode';
import { ArchetypesGuide } from './components/guide/ArchetypesGuide';

export function App() {
  const [activeTab, setActiveTab] = useState<'DRAFT' | 'ACADEMY' | 'GUIDE'>('DRAFT');

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 flex flex-col selection:bg-yellow-400 selection:text-black">
      {/* Top Navigation */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'DRAFT' && <DraftRoom />}
        {activeTab === 'ACADEMY' && <QuizMode />}
        {activeTab === 'GUIDE' && <ArchetypesGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800/80 bg-gray-950/60 py-6 text-center text-xs text-gray-500">
        <p>
          BrawlDraft Pro Assistant • Inspired by{' '}
          <span className="text-yellow-400 font-bold">bobby - brawl stars</span>' "The Best Draft Guide EVER"
        </p>
        <p className="mt-1 text-[11px] text-gray-600">
          Built following Domain-Driven Design Distilled, A Philosophy of Software Design, and The Pragmatic Programmer.
        </p>
        <p className="mt-2 text-[10px] text-gray-600">
          This material is unofficial and is not endorsed by Supercell. For more information see Supercell's Fan Content Policy:{' '}
          <a
            href="https://www.supercell.com/fan-content-policy"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-gray-400"
          >
            supercell.com/fan-content-policy
          </a>.
        </p>
      </footer>
    </div>
  );
}

export default App;
