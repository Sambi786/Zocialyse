import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, ArrowLeft, Trophy, Share2 } from 'lucide-react';
import { playArcadeSound } from '../utils/audio';
import { useAppContext } from '../AppContext';
import { toast } from '../lib/toast';
import { CricketGame } from './CricketGame';
import { ShareModal } from './ShareModal';

const SoccerGame = () => {
  const { user, updateUser } = useAppContext();
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [ballState, setBallState] = useState<'idle' | 'kicked'>('idle');
  const [ballPos, setBallPos] = useState({ x: 50, y: 80 });
  const [goaliePos, setGoaliePos] = useState(50);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  useEffect(() => {
    let interval: any;
    if (ballState === 'idle') {
      interval = setInterval(() => {
        setGoaliePos(prev => {
          const newPos = prev + (Math.random() > 0.5 ? 15 : -15);
          return Math.max(20, Math.min(80, newPos));
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [ballState]);

  const handleShoot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ballState === 'kicked') return;
    
    // Check if clicked the share button - avoid shooting
    if ((e.target as HTMLElement).closest('.share-button')) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Only allow shooting in the top half (towards the goal)
    if (y > 60) return;

    setBallPos({ x, y });
    setBallState('kicked');
    playArcadeSound('shoot');

    setTimeout(() => {
      // Check collision with goalie (goalie width is approx 20%)
      if (Math.abs(x - goaliePos) < 15 && y < 40) {
        setMessage('Saved by the keeper!');
        playArcadeSound('miss');
      } else if (x > 10 && x < 90 && y < 40) {
        setMessage('GOAL!!!');
        setScore(s => {
          const newScore = s + 1;
          if (newScore === 5 && user && !user.achievements?.includes('Soccer Pro')) {
            updateUser({ achievements: [...(user.achievements || []), 'Soccer Pro'] });
            toast({ title: "Achievement Unlocked!", message: "You earned the Soccer Pro badge!", icon: "gift" });
          }
          return newScore;
        });
        playArcadeSound('goal');
      } else {
        setMessage('Missed!');
        playArcadeSound('out');
      }

      setTimeout(() => {
        setBallState('idle');
        setBallPos({ x: 50, y: 80 });
        setMessage('');
      }, 1500);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-green-800 p-4 relative" onClick={handleShoot}>
      <div className="text-white font-bold text-2xl mb-4 absolute top-4 left-4 z-10 flex items-center gap-4">
        <span className="flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-400" /> {score}</span>
        {score > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsShareModalOpen(true); }}
            className="share-button flex items-center gap-1 text-sm bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-full text-white transition"
          >
            <Share2 className="w-4 h-4" /> Share Score
          </button>
        )}
      </div>

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`I scored ${score} goals on Zocialyse Soccer!`}
        url="https://zocialyse.app/games/soccer"
      />
      
      {/* Goal */}
      <div className="absolute top-10 w-[80%] h-32 border-4 border-white border-b-0 rounded-t-lg" />
      
      {/* Goalie */}
      <div 
        className="absolute top-24 w-12 h-16 bg-red-500 rounded-lg transition-all duration-300 z-10 flex items-center justify-center text-white"
        style={{ left: `calc(${goaliePos}% - 1.5rem)` }}
      >
        \\o/
      </div>

      {/* Ball */}
      <div 
        className={`absolute w-8 h-8 bg-white rounded-full transition-all flex items-center justify-center ${ballState === 'kicked' ? 'duration-500 ease-out' : 'duration-0'}`}
        style={{ 
          left: `calc(${ballPos.x}% - 1rem)`, 
          top: `${ballPos.y}%`,
          boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.3)'
        }}
      >
        <div className="w-4 h-4 bg-black rounded-sm" />
      </div>

      {message && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-extrabold text-yellow-300 drop-shadow-lg text-center z-20 animate-bounce">
          {message}
        </div>
      )}

      {ballState === 'idle' && !message && (
        <div className="absolute bottom-10 text-white/70 animate-pulse">
          Tap the goal to shoot!
        </div>
      )}
    </div>
  );
};

const BasketballGame = () => {
  const { user, updateUser } = useAppContext();
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [isShooting, setIsShooting] = useState(false);
  const [ballPos, setBallPos] = useState({ x: 50, y: 80, scale: 1 });
  const [hoopPos, setHoopPos] = useState(50);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    let interval: any;
    if (!isShooting) {
      interval = setInterval(() => {
        setHoopPos(prev => {
          // Move hoop left and right
          const newPos = prev + (Math.random() > 0.5 ? 10 : -10);
          return Math.max(20, Math.min(80, newPos));
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isShooting]);

  const handleShoot = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isShooting) return;
    if ((e.target as HTMLElement).closest('.share-button')) return;
    
    // Shoot straight up towards wherever the user clicked, but ball scales down to simulate depth
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    
    setBallPos({ x, y: 20, scale: 0.5 });
    setIsShooting(true);
    playArcadeSound('shoot');

    setTimeout(() => {
      // Check if ball x is close to hoop x
      if (Math.abs(x - hoopPos) < 12) {
        setMessage('SWISH!');
        setScore(s => {
          const newScore = s + 2;
          if (newScore >= 10 && user && !user.achievements?.includes('Hoops Master')) {
            updateUser({ achievements: [...(user.achievements || []), 'Hoops Master'] });
            toast({ title: "Achievement Unlocked!", message: "You earned the Hoops Master badge!", icon: "gift" });
          }
          return newScore;
        });
        playArcadeSound('swish');
        setTimeout(() => playArcadeSound('bounce'), 300);
      } else {
        setMessage('Brick!');
        playArcadeSound('bounce');
      }

      setTimeout(() => {
        setIsShooting(false);
        setBallPos({ x: 50, y: 80, scale: 1 });
        setMessage('');
      }, 1000);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 p-4 relative overflow-hidden" onClick={handleShoot}>
      <div className="text-white font-bold text-2xl mb-4 absolute top-4 left-4 z-10 flex items-center gap-4">
        <span className="flex items-center gap-2"><Trophy className="w-6 h-6 text-yellow-400" /> {score}</span>
        {score > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsShareModalOpen(true); }}
            className="share-button flex items-center gap-1 text-sm bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-full text-white transition"
          >
            <Share2 className="w-4 h-4" /> Share Score
          </button>
        )}
      </div>

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={`I scored ${score} points on Zocialyse Hoops!`}
        url="https://zocialyse.app/games/basketball"
      />

      {/* Backboard and Hoop */}
      <div 
        className="absolute top-10 flex flex-col items-center transition-all duration-500 z-0"
        style={{ left: `calc(${hoopPos}% - 3rem)` }}
      >
        <div className="w-24 h-16 border-4 border-white rounded-sm relative">
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-6 border-2 border-white" />
        </div>
        <div className="w-10 h-2 bg-orange-500 rounded-full mt-2 relative z-20" />
        {/* Net */}
        <div className="w-8 h-10 border-x-2 border-b-2 border-white/50 rounded-b-lg border-dashed opacity-70" />
      </div>

      {/* Basketball */}
      <div 
        className={`absolute w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center overflow-hidden transition-all ${isShooting ? 'duration-500 ease-in' : 'duration-0'} z-10`}
        style={{ 
          left: `calc(${ballPos.x}% - 1.5rem)`, 
          top: `${ballPos.y}%`,
          transform: `scale(${ballPos.scale})`,
          boxShadow: 'inset -3px -3px 8px rgba(0,0,0,0.5)'
        }}
      >
        <div className="absolute w-full h-[2px] bg-black/60 rotate-45" />
        <div className="absolute w-[2px] h-full bg-black/60 rotate-45" />
        <div className="absolute w-16 h-16 border-[2px] border-black/60 rounded-full -left-10" />
        <div className="absolute w-16 h-16 border-[2px] border-black/60 rounded-full -right-10" />
      </div>

      {message && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-extrabold text-orange-400 drop-shadow-lg text-center z-20 animate-bounce">
          {message}
        </div>
      )}

      {!isShooting && !message && (
        <div className="absolute bottom-10 text-white/70 animate-pulse">
          Tap the hoop to shoot!
        </div>
      )}
    </div>
  );
};


export function ZocialyseGames() {
  const [activeGame, setActiveGame] = useState<'menu' | 'soccer' | 'basketball' | 'cricket'>('menu');

  if (activeGame === 'soccer') {
    return (
      <div className="h-full relative overflow-hidden bg-slate-950">
        <button 
          onClick={() => setActiveGame('menu')}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <SoccerGame />
      </div>
    );
  }

  if (activeGame === 'basketball') {
    return (
      <div className="h-full relative overflow-hidden bg-slate-950">
        <button 
          onClick={() => setActiveGame('menu')}
          className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <BasketballGame />
      </div>
    );
  }

  if (activeGame === 'cricket') {
    return (
      <div className="h-full relative overflow-hidden bg-slate-950">
        <CricketGame onExit={() => setActiveGame('menu')} />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] bg-slate-950 text-white overflow-y-auto pb-24">
      <div className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900 border-dashed">
        <div className="flex items-center justify-between p-4 pt-safe">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black font-sans uppercase tracking-tight flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-indigo-400" />
              Arcade
            </h1>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-gradient-to-br from-green-600 to-green-900 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] transition-transform shadow-xl relative overflow-hidden" onClick={() => setActiveGame('soccer')}>
          <div className="absolute -right-10 -bottom-10 opacity-20 text-[120px]">⚽</div>
          <h2 className="text-2xl font-bold mb-2 relative z-10">Penalty Shootout</h2>
          <p className="text-white/80 text-sm relative z-10">Test your reflexes against the keeper! Tap to shoot and score goals.</p>
          <div className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold inline-block relative z-10 hover:bg-white/30 transition-colors">
            Play Soccer
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-800 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] transition-transform shadow-xl relative overflow-hidden" onClick={() => setActiveGame('basketball')}>
          <div className="absolute -right-10 -bottom-10 opacity-20 text-[120px]">🏀</div>
          <h2 className="text-2xl font-bold mb-2 relative z-10">Hoops Master</h2>
          <p className="text-white/80 text-sm relative z-10">Time your shots perfectly to sink the ball through the moving hoop.</p>
          <div className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold inline-block relative z-10 hover:bg-white/30 transition-colors">
            Play Basketball
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] transition-transform shadow-xl relative overflow-hidden" onClick={() => setActiveGame('cricket')}>
          <div className="absolute -right-10 -bottom-10 opacity-20 text-[120px]">🏏</div>
          <h2 className="text-2xl font-bold mb-2 relative z-10">Stick Cricket WC Edition</h2>
          <p className="text-white/80 text-sm relative z-10">Time your swing to hit boundaries and score high without losing wickets.</p>
          <div className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold inline-block relative z-10 hover:bg-white/30 transition-colors">
            Play Cricket
          </div>
        </div>
      </div>
    </div>
  );
}
