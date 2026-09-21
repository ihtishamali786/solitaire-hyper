import React, { useState, useEffect } from 'react';
import { Card as CardType, GameState, HintResult, PileType } from './types/solitaire';
import { initGame, canPlaceOnFoundation, canPlaceOnTableau, isGameWon, findBestMove, suitColor } from './utils/engine';
import { sound } from './utils/audio';
import { getStoredCoins, saveCoins, getStoredStats, saveStats } from './utils/storage';
import { RotateCcw, Lightbulb, Coins, Volume2, VolumeX, Trophy, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

const suitSymbols: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export default function App() {
  const [game, setGame] = useState<GameState>(() => initGame());
  const [history, setHistory] = useState<GameState[]>([]);
  const [coins, setCoins] = useState<number>(getStoredCoins);
  const [stats, setStats] = useState(getStoredStats);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hint, setHint] = useState<HintResult | null>(null);
  const [showWin, setShowWin] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!game.isWon && !showWin) {
        setGame(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [game.isWon, showWin]);

  useEffect(() => {
    if (!game.isWon && isGameWon(game.foundations)) {
      setGame(prev => ({ ...prev, isWon: true }));
      setShowWin(true);
      if (soundEnabled) sound.playWin();
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      const nextCoins = coins + 250;
      setCoins(nextCoins);
      saveCoins(nextCoins);
      const nextStats = { ...stats, gamesPlayed: stats.gamesPlayed + 1, gamesWon: stats.gamesWon + 1, streak: stats.streak + 1 };
      setStats(nextStats);
      saveStats(nextStats);
    }
  }, [game.foundations]);

  const saveHistory = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(game))]);
    setHint(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setGame(last);
    setHistory(prev => prev.slice(0, -1));
    setHint(null);
    if (soundEnabled) sound.playCardFlip();
  };

  const handleStockClick = () => {
    saveHistory();
    if (soundEnabled) sound.playCardFlip();
    setGame(prev => {
      if (prev.stock.length === 0) {
        return {
          ...prev,
          stock: [...prev.waste].reverse().map(c => ({ ...c, isFaceUp: false })),
          waste: [],
          moves: prev.moves + 1,
        };
      }
      const drawn = { ...prev.stock[prev.stock.length - 1], isFaceUp: true };
      return {
        ...prev,
        stock: prev.stock.slice(0, -1),
        waste: [...prev.waste, drawn],
        moves: prev.moves + 1,
      };
    });
  };

  const handleCardClick = (card: CardType, from: PileType, colIdx?: number) => {
    if (!card.isFaceUp) return;

    for (let f = 0; f < 4; f++) {
      if (canPlaceOnFoundation(card, game.foundations[f])) {
        moveCard(from, { type: 'foundation', colIndex: f }, card, colIdx);
        return;
      }
    }

    for (let c = 0; c < 7; c++) {
      if (c === colIdx && from === 'tableau') continue;
      if (canPlaceOnTableau(card, game.tableau[c])) {
        moveCard(from, { type: 'tableau', colIndex: c }, card, colIdx);
        return;
      }
    }
  };

  const moveCard = (fromType: PileType, to: { type: PileType; colIndex?: number }, card: CardType, fromCol?: number) => {
    saveHistory();
    if (soundEnabled) sound.playCardFlip();

    setGame(prev => {
      const nextWaste = [...prev.waste];
      const nextFoundations = prev.foundations.map(arr => [...arr]) as [CardType[], CardType[], CardType[], CardType[]];
      const nextTableau = prev.tableau.map(col => [...col]);
      let moving: CardType[] = [];

      if (fromType === 'waste') {
        moving = [nextWaste.pop()!];
      } else if (fromType === 'tableau' && fromCol !== undefined) {
        const col = nextTableau[fromCol];
        const idx = col.findIndex(c => c.id === card.id);
        moving = col.splice(idx);
        if (col.length > 0 && !col[col.length - 1].isFaceUp) {
          col[col.length - 1].isFaceUp = true;
        }
      }

      if (to.type === 'foundation' && to.colIndex !== undefined) {
        nextFoundations[to.colIndex].push(...moving);
      } else if (to.type === 'tableau' && to.colIndex !== undefined) {
        nextTableau[to.colIndex].push(...moving);
      }

      return {
        ...prev,
        waste: nextWaste,
        foundations: nextFoundations,
        tableau: nextTableau,
        score: prev.score + (to.type === 'foundation' ? 10 : 5),
        moves: prev.moves + 1,
      };
    });
  };

  const handleHint = () => {
    const res = findBestMove(game);
    setHint(res);
  };

  const resetGame = () => {
    setGame(initGame());
    setHistory([]);
    setHint(null);
    setShowWin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-green-900 to-emerald-950 text-white flex flex-col items-center select-none p-2 sm:p-4">
      {/* HUD Header */}
      <header className="w-full max-w-4xl flex items-center justify-between bg-black/40 backdrop-blur-md px-3 py-2 rounded-2xl border border-amber-400/30 mb-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <Coins className="w-4 h-4 text-amber-300" />
          <span>{coins}</span>
        </div>
        <div className="flex items-center gap-3 text-stone-300">
          <span>Moves: <strong className="text-white">{game.moves}</strong></span>
          <span>Time: <strong className="text-white font-mono">{Math.floor(game.timeElapsed / 60)}:{(game.timeElapsed % 60).toString().padStart(2, '0')}</strong></span>
          <span>Score: <strong className="text-emerald-400">{game.score}</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-stone-300">
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={handleUndo} disabled={history.length === 0} className="p-1.5 rounded-lg bg-white/10 disabled:opacity-30">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={handleHint} className="px-2.5 py-1.5 rounded-lg bg-amber-500 font-bold text-black flex items-center gap-1">
            <Lightbulb className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hint</span>
          </button>
          <button onClick={resetGame} className="p-1.5 rounded-lg bg-white/10">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hint Alert */}
      {hint && (
        <div className="w-full max-w-md bg-amber-400 text-black px-3 py-1.5 rounded-xl font-medium text-xs text-center mb-2 shadow-lg animate-fade-in flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>{hint.explanation}</span>
          </div>
          <button onClick={() => setHint(null)} className="font-bold uppercase text-[10px] ml-2">X</button>
        </div>
      )}

      {/* Game Board */}
      <main className="w-full max-w-4xl flex-1 flex flex-col gap-4">
        {/* Top Row: Stock, Waste, Foundations */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Stock */}
          <div className="flex justify-center">
            {game.stock.length > 0 ? (
              <div onClick={handleStockClick} className="w-11 sm:w-16 md:w-20 h-16 sm:h-24 md:h-28 rounded-lg bg-gradient-to-br from-blue-900 to-indigo-950 border border-amber-400/40 shadow cursor-pointer flex items-center justify-center">
                <div className="w-5 h-5 border border-amber-400/30 rotate-45" />
              </div>
            ) : (
              <div onClick={handleStockClick} className="w-11 sm:w-16 md:w-20 h-16 sm:h-24 md:h-28 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer text-white/40">↺</div>
            )}
          </div>

          {/* Waste */}
          <div className="flex justify-center">
            {game.waste.length > 0 ? (
              <RenderCard card={game.waste[game.waste.length - 1]} onClick={() => handleCardClick(game.waste[game.waste.length - 1], 'waste')} />
            ) : (
              <div className="w-11 sm:w-16 md:w-20 h-16 sm:h-24 md:h-28 rounded-lg border border-white/10" />
            )}
          </div>

          <div className="hidden sm:block" />

          {/* 4 Foundations */}
          {game.foundations.map((foundation, idx) => (
            <div key={idx} className="flex justify-center">
              {foundation.length > 0 ? (
                <RenderCard card={foundation[foundation.length - 1]} />
              ) : (
                <div className="w-11 sm:w-16 md:w-20 h-16 sm:h-24 md:h-28 rounded-lg border-2 border-dashed border-amber-400/20 flex items-center justify-center text-amber-400/30 text-base sm:text-xl font-serif">
                  {['♥', '♦', '♣', '♠'][idx]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tableau 7 Columns */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 items-start min-h-[350px]">
          {game.tableau.map((column, colIdx) => (
            <div key={colIdx} className="flex flex-col items-center relative min-h-[140px]">
              {column.length === 0 ? (
                <div className="w-11 sm:w-16 md:w-20 h-16 sm:h-24 md:h-28 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-white/20 font-bold text-xs">K</div>
              ) : (
                column.map((card, cardIdx) => (
                  <div
                    key={card.id}
                    style={{
                      position: cardIdx === 0 ? 'relative' : 'absolute',
                      top: cardIdx === 0 ? 0 : `${cardIdx * 18}px`,
                      zIndex: cardIdx + 1,
                    }}
                  >
                    <RenderCard card={card} onClick={() => handleCardClick(card, 'tableau', colIdx)} />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </main>

      {/* Win Modal */}
      {showWin && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-amber-400/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Trophy className="w-14 h-14 text-amber-400 mx-auto mb-2 animate-bounce" />
            <h2 className="text-2xl font-bold text-amber-300 font-serif mb-1">Victory Royale!</h2>
            <p className="text-stone-400 text-xs mb-4">You solved the Klondike board!</p>
            <div className="bg-black/50 p-3 rounded-xl border border-white/10 mb-4 text-sm font-semibold text-emerald-400">
              +250 Coins Awarded!
            </div>
            <button onClick={resetGame} className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-bold">
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RenderCard({ card, onClick }: { card: CardType; onClick?: () => void }) {
  const isRed = suitColor(card.suit) === 'red';

  if (!card.isFaceUp) {
    return (
      <div className="w-11 sm:w-16 md:w-20 h-16 sm:h-24 md:h-28 rounded-lg bg-gradient-to-br from-blue-900 to-indigo-950 border border-amber-400/40 shadow flex items-center justify-center">
        <div className="w-4 h-4 border border-amber-400/30 rotate-45" />
      </div>
    );
  }

  const renderRank = (val: number) => {
    if (val === 1) return 'A';
    if (val === 11) return 'J';
    if (val === 12) return 'Q';
    if (val === 13) return 'K';
    return val.toString();
  };

  return (
    <div
      onClick={onClick}
      className="w-11 sm:w-16 md:w-20 h-16 sm:h-24 md:h-28 bg-white rounded-lg border border-slate-300 shadow cursor-pointer relative select-none hover:-translate-y-0.5 transition-transform"
    >
      <div className={`absolute top-0.5 left-1 flex flex-col items-center leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-bold text-[10px] sm:text-xs font-serif">{renderRank(card.value)}</span>
        <span className="text-[10px] sm:text-xs">{suitSymbols[card.suit]}</span>
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-sm sm:text-xl font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        {suitSymbols[card.suit]}
      </div>
    </div>
  );
}
