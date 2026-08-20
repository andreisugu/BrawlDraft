import React, { useState, useEffect } from 'react';
import { DRAFT_QUIZZES, DraftQuiz } from '../../domain/data/quizzes';
import { MAP_MAP } from '../../domain/data/maps';
import { BRAWLER_MAP, BRAWLERS } from '../../domain/data/brawlers';
import { BrawlerAvatar } from '../common/BrawlerAvatar';
import {
  GraduationCap,
  Trophy,
  CheckCircle2,
  XCircle,
  Timer,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const QuizMode: React.FC = () => {
  const [filterType, setFilterType] = useState<'ALL' | 'PICK' | 'BAN'>('ALL');
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedBrawlerId, setSelectedBrawlerId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [scores, setScores] = useState<Record<string, boolean>>({});

  // 5-second timer
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const activeQuizzes = DRAFT_QUIZZES.filter(
    q => filterType === 'ALL' || q.type === filterType
  );

  const currentQuiz: DraftQuiz = activeQuizzes[currentQuizIndex] || activeQuizzes[0];
  const currentMap = MAP_MAP[currentQuiz.mapId];

  // Reset answer when moving to next quiz
  useEffect(() => {
    setSelectedBrawlerId(null);
    setHasSubmitted(false);
    setIsCorrect(null);
    setTimeLeft(5);
    if (timerEnabled) {
      setIsTimerRunning(true);
    }
  }, [currentQuizIndex, filterType, timerEnabled]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0 && !hasSubmitted) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && !hasSubmitted) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, hasSubmitted]);

  // Handle submission
  const handleSubmit = () => {
    if (!selectedBrawlerId) return;

    const brawler = BRAWLER_MAP[selectedBrawlerId];
    const isExactMatch = currentQuiz.correctBrawlers.includes(selectedBrawlerId);
    const isArchetypeMatch =
      currentQuiz.correctArchetypes && brawler
        ? currentQuiz.correctArchetypes.includes(brawler.archetype)
        : false;

    const correct = isExactMatch || isArchetypeMatch;
    setIsCorrect(correct);
    setHasSubmitted(true);
    setIsTimerRunning(false);

    setScores(prev => ({
      ...prev,
      [currentQuiz.id]: correct,
    }));
  };

  const totalAnswered = Object.keys(scores).length;
  const totalCorrect = Object.values(scores).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Score Tracker */}
      <div className="bg-gray-900/80 border border-gray-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-yellow-400" />
              <h2 className="font-brawl text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500">
                PRO DRAFT ACADEMY
              </h2>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Master the official 16 draft scenarios & ban tests from Bobby's Masterclass.
            </p>
          </div>

          {/* Quiz Filter & Score Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => {
                  setFilterType('ALL');
                  setCurrentQuizIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  filterType === 'ALL'
                    ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All (16)
              </button>
              <button
                onClick={() => {
                  setFilterType('PICK');
                  setCurrentQuizIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  filterType === 'PICK'
                    ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                10 Pick Quizzes
              </button>
              <button
                onClick={() => {
                  setFilterType('BAN');
                  setCurrentQuizIndex(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all ${
                  filterType === 'BAN'
                    ? 'bg-yellow-400 text-black shadow-md shadow-yellow-400/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                6 Ban Quizzes
              </button>
            </div>

            {/* Score pill */}
            <div className="flex items-center gap-2 bg-yellow-950/40 border border-yellow-500/40 px-3.5 py-1.5 rounded-xl">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-bold text-yellow-300">
                Score: <span className="text-white font-black text-sm">{totalCorrect}</span> / {totalAnswered}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Scenario Card */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Scenario Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="font-brawl text-2xl text-yellow-400">
              #{currentQuiz.quizNumber}
            </span>
            <div>
              <h3 className="font-brawl text-xl text-white">{currentQuiz.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-bold text-orange-400">
                  {currentMap?.name} ({currentMap?.mode.replace('_', ' ')})
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-xs font-semibold text-blue-400">
                  {currentMap?.terrain}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-xs font-bold text-purple-400 uppercase">
                  {currentQuiz.type} TASK
                </span>
              </div>
            </div>
          </div>

          {/* 5-second timer toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTimerEnabled(!timerEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timerEnabled
                  ? 'bg-red-500 text-white font-black animate-pulse'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>5s Pro Timer: {timerEnabled ? `${timeLeft}s` : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Current Draft Context */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Ally Team */}
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-2xl p-4">
            <span className="text-xs uppercase font-black text-blue-400 tracking-wider">
              Your Team Lineup:
            </span>
            <div className="flex items-center gap-3 mt-3">
              {currentQuiz.allyPicks.length > 0 ? (
                currentQuiz.allyPicks.map(id => (
                  <BrawlerAvatar key={id} brawler={BRAWLER_MAP[id]} size="md" />
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">No picks locked in yet</span>
              )}
            </div>
          </div>

          {/* Opponent Team */}
          <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4">
            <span className="text-xs uppercase font-black text-red-400 tracking-wider">
              Opponent Team Lineup:
            </span>
            <div className="flex items-center gap-3 mt-3">
              {currentQuiz.enemyPicks.length > 0 ? (
                currentQuiz.enemyPicks.map(id => (
                  <BrawlerAvatar key={id} brawler={BRAWLER_MAP[id]} size="md" />
                ))
              ) : (
                <span className="text-xs text-gray-400 italic">No picks locked in yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Selection Area */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-300">
              {currentQuiz.type === 'BAN'
                ? 'Select the brawler you would BAN:'
                : 'Select the brawler you would PICK:'}
            </span>
            {selectedBrawlerId && (
              <span className="text-xs font-bold text-yellow-400">
                Selected: {BRAWLER_MAP[selectedBrawlerId]?.name}
              </span>
            )}
          </div>

          {/* Quick candidates grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2.5 max-h-60 overflow-y-auto p-2 bg-gray-950/60 rounded-2xl border border-gray-800">
            {BRAWLERS.map(brawler => {
              const isSelected = selectedBrawlerId === brawler.id;
              const isAlreadyDrafted =
                currentQuiz.allyPicks.includes(brawler.id) ||
                currentQuiz.enemyPicks.includes(brawler.id);

              if (isAlreadyDrafted) return null;

              return (
                <div
                  key={brawler.id}
                  onClick={() => !hasSubmitted && setSelectedBrawlerId(brawler.id)}
                  className="cursor-pointer"
                >
                  <BrawlerAvatar
                    brawler={brawler}
                    size="sm"
                    selected={isSelected}
                    showArchetype={false}
                  />
                </div>
              );
            })}
          </div>

          {/* Submit / Result Action */}
          {!hasSubmitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedBrawlerId}
              className={`w-full py-3 rounded-2xl font-brawl tracking-wider text-base transition-all flex items-center justify-center gap-2 ${
                selectedBrawlerId
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black shadow-lg shadow-yellow-500/20 active:scale-95'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>LOCK IN ANSWER</span>
            </button>
          ) : (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {/* Correct/Incorrect Banner */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border flex items-start gap-3.5 ${
                  isCorrect
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-500/50 text-rose-300'
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-brawl text-xl text-white">
                      {isCorrect ? 'PRO DECISION: CORRECT!' : 'INCORRECT DECISION'}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-200">
                    <span className="font-bold text-yellow-400">Bobby's Breakdown: </span>
                    {currentQuiz.bobbyExplanation}
                  </p>
                  <div className="text-xs bg-black/40 p-2.5 rounded-xl border border-white/10 text-yellow-300 font-semibold">
                    💡 Pro Tip: {currentQuiz.proTip}
                  </div>
                </div>
              </div>

              {/* Navigation controls */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setHasSubmitted(false);
                    setSelectedBrawlerId(null);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry Scenario</span>
                </button>

                <button
                  onClick={() => {
                    if (currentQuizIndex < activeQuizzes.length - 1) {
                      setCurrentQuizIndex(prev => prev + 1);
                    } else {
                      setCurrentQuizIndex(0);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-brawl tracking-wider text-sm transition-all shadow-lg shadow-yellow-500/20 active:scale-95"
                >
                  <span>NEXT SCENARIO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
