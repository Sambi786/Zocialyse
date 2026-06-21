import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Flag, Shield, Share2 } from 'lucide-react';
import { playArcadeSound } from '../utils/audio';
import { useAppContext } from '../AppContext';
import { toast } from '../lib/toast';
import { ShareModal } from './ShareModal';

const TEAMS = [
  { name: 'India', color: 'bg-blue-600', text: 'text-blue-100', flag: '🇮🇳' },
  { name: 'Australia', color: 'bg-yellow-500', text: 'text-yellow-900', flag: '🇦🇺' },
  { name: 'England', color: 'bg-red-600', text: 'text-red-100', flag: '🇬🇧' },
  { name: 'South Africa', color: 'bg-green-600', text: 'text-green-100', flag: '🇿🇦' },
  { name: 'New Zealand', color: 'bg-black', text: 'text-white', flag: '🇳🇿' },
  { name: 'Pakistan', color: 'bg-green-700', text: 'text-green-100', flag: '🇵🇰' },
];

export const CricketGame = ({ onExit }: { onExit: () => void }) => {
  const { user, updateUser } = useAppContext();
  
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'result'>('setup');
  const [myTeam, setMyTeam] = useState(TEAMS[0]);
  const [opponent, setOpponent] = useState(TEAMS[1]);
  const [target, setTarget] = useState(0);
  
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [ballsLeft, setBallsLeft] = useState(30);
  
  const [ballState, setBallState] = useState<'idle' | 'bowling' | 'hit'>('idle');
  const [ballPos, setBallPos] = useState({ x: 50, y: 30, scale: 0.5 });
  const [ballDir, setBallDir] = useState<'left' | 'center' | 'right'>('center');
  const [batSwing, setBatSwing] = useState<'none' | 'left' | 'right' | 'straight'>('none');
  const [message, setMessage] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const [pitchMarker, setPitchMarker] = useState<{x: number, y: number} | null>(null);

  const startGame = () => {
    setGameState('playing');
    setTarget(Math.floor(Math.random() * 30) + 45); // Target between 45 and 75
    setScore(0);
    setWickets(0);
    setBallsLeft(30);
    setBallState('idle');
    setMessage('');
    setPitchMarker(null);
  };

  const bowlNextBall = () => {
    if (ballState !== 'idle' || ballsLeft <= 0 || wickets >= 10 || score >= target) return;
    
    setBallState('bowling');
    setMessage('');
    setBatSwing('none');
    
    const dirs: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];
    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    setBallDir(dir);
    
    let endX = 50;
    if (dir === 'left') endX = 35;
    if (dir === 'right') endX = 65;
    
    // Show pitch marker
    setPitchMarker({ x: endX, y: 65 });
    
    // Animate ball
    setTimeout(() => {
      playArcadeSound('bowl');
      setBallPos({ x: endX, y: 80, scale: 1 });
      setPitchMarker(null);
      
      // Auto-miss if no hit
      setTimeout(() => {
        setBallState(current => {
          if (current === 'bowling') {
            handleResult('miss');
            return 'idle';
          }
          return current;
        });
      }, 500); // Gives user 500ms to hit after bowl
    }, 400); // Time showing the marker before bowl
  };

  const hit = (direction: 'left' | 'right' | 'straight') => {
    if (ballState !== 'bowling') return;
    setBatSwing(direction);
    
    let isCorrectDirection = false;
    if (ballDir === 'left' && direction === 'left') isCorrectDirection = true;
    if (ballDir === 'right' && direction === 'right') isCorrectDirection = true;
    if (ballDir === 'center' && direction === 'straight') isCorrectDirection = true;
    // Allow straight hitting to be slightly forgiving
    if (ballDir === 'center' && (direction === 'left' || direction === 'right')) {
      isCorrectDirection = Math.random() > 0.5; // 50% chance
    }
    
    if (isCorrectDirection) {
      handleResult('hit', direction);
    } else {
      handleResult('edge');
    }
  };

  const handleResult = (type: 'hit' | 'edge' | 'miss', hitDir?: 'left' | 'right' | 'straight') => {
    setBallState('hit');
    setBallsLeft(b => b - 1);
    
    let runs = 0;
    let msg = '';
    
    let isWicket = false;

    if (type === 'hit') {
      const outcome = Math.random();
      if (outcome > 0.6) {
        runs = 6;
        msg = 'SIX!';
        playArcadeSound('hit');
        setTimeout(() => playArcadeSound('cheer'), 200);
      } else if (outcome > 0.2) {
        runs = 4;
        msg = 'FOUR!';
        playArcadeSound('hit');
        setTimeout(() => playArcadeSound('cheer'), 200);
      } else {
        runs = 2;
        msg = '2 Runs';
        playArcadeSound('hit');
      }
      
      let finalX = 50;
      if (hitDir === 'left') finalX = 10;
      if (hitDir === 'right') finalX = 90;
      setBallPos({ x: finalX, y: -10, scale: 0.3 });
    } else if (type === 'edge') {
      const outcome = Math.random();
      if (outcome > 0.7) {
        msg = 'OUT! Caught!';
        isWicket = true;
        playArcadeSound('out');
      } else {
        runs = 1;
        msg = '1 Run';
        playArcadeSound('hit');
      }
      setBallPos({ x: Math.random() * 100, y: 110, scale: 0.5 });
    } else {
      msg = 'OUT! Bowled!';
      isWicket = true;
      playArcadeSound('out');
      setBallPos({ x: 50, y: 90, scale: 0.5 });
    }
    
    // We captured the values in closure, so calculate new states here:
    const newScore = score + runs;
    const newWickets = wickets + (isWicket ? 1 : 0);
    const currentBallsLeft = ballsLeft - 1;

    setScore(newScore);
    if (isWicket) setWickets(newWickets);
    setMessage(msg);
    
    setTimeout(() => {
      checkGameEnd(newScore, newWickets, currentBallsLeft);
    }, 1500);
  };

  const checkGameEnd = (newScore: number, newWickets: number, currentBallsLeft: number) => {
    if (newScore >= target) {
      setGameState('result');
      if (user && !user.achievements?.includes('Cricket Legend')) {
        updateUser({ achievements: [...(user.achievements || []), 'Cricket Legend'] });
        toast({ title: "Achievement Unlocked!", message: "You earned the Cricket Legend badge!", icon: "gift" });
      }
    } else if (newWickets >= 10 || currentBallsLeft <= 0) {
      setGameState('result');
    } else {
      resetForNextBall();
    }
  };

  const resetForNextBall = () => {
    setBallState('idle');
    setBallPos({ x: 50, y: 30, scale: 0.5 });
    setMessage('');
    setBatSwing('none');
  };

  if (gameState === 'setup') {
    return (
      <div className="h-full bg-slate-900 text-white flex flex-col items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(to bottom, #0f172a, #064e3b)' }}>
        <button onClick={onExit} className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h2 className="text-4xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 text-center uppercase tracking-wider title-shadow drop-shadow-xl">Super Stick Cricket</h2>
        
        <div className="w-full max-w-md bg-slate-800/80 backdrop-blur border border-slate-700 p-6 rounded-2xl shadow-2xl">
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Select Your Team</label>
            <div className="grid grid-cols-2 gap-3">
              {TEAMS.map(team => (
                <button 
                  key={team.name}
                  onClick={() => setMyTeam(team)}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${myTeam.name === team.name ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-600 bg-slate-700/50 hover:bg-slate-600 hover:border-slate-500'}`}
                >
                  <span className="text-3xl mb-1">{team.flag}</span>
                  <span className="font-bold text-sm text-center">{team.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-8">
            <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Select Opponent</label>
            <div className="grid grid-cols-2 gap-3">
              {TEAMS.map(team => (
                <button 
                  key={team.name}
                  onClick={() => setOpponent(team)}
                  disabled={myTeam.name === team.name}
                  className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${opponent.name === team.name ? 'border-red-500 bg-red-500/20' : 'border-slate-600 bg-slate-700/50 hover:bg-slate-600'} ${myTeam.name === team.name ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <span className="text-3xl mb-1">{team.flag}</span>
                  <span className="font-bold text-sm text-center">{team.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={startGame}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-xl rounded-xl shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98] transition-all uppercase tracking-widest"
          >
            Start Match Let's Go!
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'result') {
    const isWin = score >= target;
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 relative">
        <button onClick={() => setGameState('setup')} className="absolute top-4 left-4 z-50 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        
        <h2 className={`text-6xl font-black mb-2 uppercase tracking-widest ${isWin ? 'text-emerald-400' : 'text-red-500'}`}>
          {isWin ? 'You Won!' : 'You Lost!'}
        </h2>
        
        <div className="bg-slate-800 p-8 rounded-3xl mt-8 w-full max-w-sm text-center shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-center">
              <span className="text-5xl">{myTeam.flag}</span>
              <span className="mt-2 font-bold">{score}/{wickets}</span>
            </div>
            <span className="text-2xl font-black text-slate-500">VS</span>
            <div className="flex flex-col items-center">
              <span className="text-5xl opacity-50">{opponent.flag}</span>
              <span className="mt-2 text-slate-400 font-bold">{target - 1}</span>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-6">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Target was</p>
            <p className="text-3xl font-black text-white">{target}</p>
          </div>
        </div>
        
        <div className="flex gap-4 mt-8 w-full max-w-sm">
          <button 
            onClick={startGame}
            className="flex-1 py-4 bg-emerald-500 text-white font-black text-xl rounded-2xl shadow-lg hover:bg-emerald-400 transition-all uppercase"
          >
            Play Again
          </button>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="w-16 flex items-center justify-center bg-blue-500 text-white rounded-2xl shadow-lg hover:bg-blue-400 transition-all"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        <ShareModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          title={`I scored ${score} runs in Super Stick Cricket!`}
          url="https://zocialyse.app/games/cricket"
        />
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden bg-emerald-800 select-none">
      <button onClick={onExit} className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Header Info */}
      <div className="absolute top-0 left-0 w-full bg-slate-900/80 backdrop-blur text-white flex justify-between p-3 z-30 font-bold text-sm shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">{myTeam.flag}</span>
          <span className="text-2xl text-emerald-400">{score}<span className="text-lg text-slate-400">/{wickets}</span></span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-slate-300">Target: <span className="text-white text-lg">{target}</span></span>
          <span className="text-slate-400">{score >= target ? 0 : target - score} runs from {ballsLeft} balls</span>
        </div>
      </div>

      {/* Pitch Area */}
      <div className="absolute inset-x-0 bottom-32 top-16 flex justify-center perspective-[1000px]">
        {/* Grass pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, transparent 20%, #000 120%)' }} />
        
        {/* The Pitch */}
        <div className="w-48 h-full bg-[#e3cd96] border-x-4 border-[#c2aa70] relative" style={{ transform: 'rotateX(40deg)', transformOrigin: 'bottom center' }}>
          {/* Crease lines top */}
          <div className="absolute top-[10%] w-full h-[2px] bg-white/70" />
          <div className="absolute top-[12%] left-[10%] bottom-0 w-[2px] bg-white/50" />
          <div className="absolute top-[12%] right-[10%] bottom-0 w-[2px] bg-white/50" />
          
          {/* Crease lines bottom */}
          <div className="absolute bottom-[15%] w-full h-[4px] bg-white z-10" />
          <div className="absolute bottom-0 w-full h-[2px] bg-white/50" />
          
          {/* Pitch Marker */}
          {pitchMarker && (
            <div 
              className="absolute w-8 h-8 rounded-full bg-yellow-400/50 blur-[2px] animate-pulse -ml-4"
              style={{ left: `${pitchMarker.x}%`, top: `${pitchMarker.y}%` }}
            />
          )}

          {/* Stumps Bottom */}
          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 flex gap-1 items-end h-16 z-10">
            <div className="w-1.5 h-full bg-orange-200 border-l border-orange-400 rounded-t-sm shadow-xl" />
            <div className="w-1.5 h-full bg-orange-200 border-l border-orange-400 rounded-t-sm shadow-xl" />
            <div className="w-1.5 h-full bg-orange-200 border-l border-orange-400 rounded-t-sm shadow-xl" />
            {/* Bails */}
            <div className="absolute top-0 left-0 w-[12px] h-1 bg-amber-800 rounded-full" />
            <div className="absolute top-0 right-0 w-[12px] h-1 bg-amber-800 rounded-full" />
          </div>

          {/* Stumps Top */}
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2 flex gap-[2px] items-end h-8 z-0">
            <div className="w-1 h-full bg-orange-300 rounded-t-sm" />
            <div className="w-1 h-full bg-orange-300 rounded-t-sm" />
            <div className="w-1 h-full bg-orange-300 rounded-t-sm" />
          </div>
        </div>

        {/* Batsman */}
        <div className="absolute bottom-[10%] left-1/2 flex flex-col items-center z-20 pointer-events-none" style={{ marginLeft: batSwing === 'left' ? '-40px' : batSwing === 'right' ? '40px' : '-24px' }}>
          {/* Helmet */}
          <div className={`w-8 h-8 rounded-full shadow-lg border-2 ${myTeam.color.replace('bg-', 'border-')} ${myTeam.color}`} />
          {/* Body */}
          <div className="w-12 h-16 bg-white rounded-t-xl mt-1 shadow-inner relative flex justify-center">
            {/* Pads */}
            <div className="absolute -bottom-6 flex gap-2">
              <div className="w-4 h-10 bg-white border border-slate-200 rounded-full" />
              <div className="w-4 h-10 bg-white border border-slate-200 rounded-full" />
            </div>
          </div>
          
          {/* Bat - Dynamic */}
          <div 
            className={`absolute w-3 h-24 bg-amber-700 rounded-b-md shadow-2xl origin-top transition-transform duration-100 top-12 left-0`}
            style={{ 
              transform: batSwing === 'none' 
                ? 'rotate(-25deg) translateY(10px)' 
                : batSwing === 'left' 
                  ? 'rotate(-100deg) translateY(-20px) translateX(-10px)' 
                  : batSwing === 'right' 
                    ? 'rotate(80deg) translateY(-10px) translateX(20px)'
                    : 'rotate(0deg) translateY(-20px)'
            }}
          />
        </div>

        {/* Ball */}
        <div 
          className={`absolute w-3 h-3 bg-red-600 rounded-full shadow-md z-20 pointer-events-none transition-all ${ballState === 'bowling' ? 'duration-[500ms] ease-in' : ballState === 'hit' ? 'duration-500 ease-out' : 'duration-0 opacity-0'}`}
          style={{ 
            left: `calc(50% - 24px + ${ballPos.x * 0.48}px)`, 
            top: `${10 + ballPos.y * 0.7}%`,
            transform: `scale(${ballPos.scale * 2})`
          }}
        >
          <div className="absolute inset-0 bg-white/20 rounded-full" />
        </div>
      </div>

      {message && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 text-center pointer-events-none">
          <div className="text-5xl font-black text-yellow-300 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-bounce stroke-black" style={{ WebkitTextStroke: '2px black' }}>
            {message}
          </div>
        </div>
      )}

      {ballState === 'idle' && !message && wickets < 10 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40">
          <button 
            onClick={bowlNextBall}
            className="px-8 py-3 bg-yellow-400 text-yellow-900 font-black rounded-full shadow-lg hover:bg-yellow-300 active:scale-95 animate-pulse text-xl uppercase tracking-widest"
          >
            BOWL MATCH
          </button>
        </div>
      )}

      {/* Controls Container fixed at bottom */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-slate-900 flex justify-between gap-4 z-50 rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        <button 
          onClick={() => hit('left')}
          className="flex-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-2xl py-6 flex flex-col items-center justify-center text-white font-black uppercase text-xl shadow-inner active:scale-95 transition-all outline-none border-b-4 border-slate-800"
        >
           ⬅️ OFF <span className="text-xs text-slate-400 mt-1 block">Left Hit</span>
        </button>
        <button 
          onClick={() => hit('straight')}
          className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-400 rounded-2xl py-6 flex flex-col items-center justify-center text-white font-black uppercase text-xl shadow-inner active:scale-95 transition-all outline-none border-b-4 border-emerald-800"
        >
          ⬆️ STRAIGHT <span className="text-xs text-emerald-200 mt-1 block">Center Hit</span>
        </button>
        <button 
          onClick={() => hit('right')}
          className="flex-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 rounded-2xl py-6 flex flex-col items-center justify-center text-white font-black uppercase text-xl shadow-inner active:scale-95 transition-all outline-none border-b-4 border-slate-800"
        >
          LEG ➡️ <span className="text-xs text-slate-400 mt-1 block">Right Hit</span>
        </button>
      </div>
    </div>
  );
};
