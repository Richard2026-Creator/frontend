import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Undo2, Volume2, VolumeX, X, Heart } from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { LibraryImage, StudioSettings, SessionResult, SwipeDecision } from '../types';
import { SwipeCard } from '../components/SwipeCard';
import { analyzeSession } from '../services/intelligence';

interface DiscoveryProps {
  library: LibraryImage[];
  settings: StudioSettings;
  clientName?: string;
  onComplete: (result: SessionResult) => void;
  onCancel: () => void;
}

const cardVariants = {
  enter: { 
    scale: 0.9, 
    opacity: 0, 
    y: 20 
  },
  center: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    x: 0,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8
    }
  },
  exit: (direction: 'left' | 'right' | null) => ({
    x: direction === 'right' ? 1200 : direction === 'left' ? -1200 : 0,
    rotate: direction === 'right' ? 35 : direction === 'left' ? -35 : 0,
    opacity: 0,
    transition: { 
      duration: 0.45,
      ease: [0.32, 0.72, 0, 1]
    }
  })
};

export const Discovery: React.FC<DiscoveryProps> = ({ library, settings, clientName, onComplete, onCancel }) => {
  const [sessionStack, setSessionStack] = useState<LibraryImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState<SwipeDecision[]>([]);
  const [lastDecisionTime, setLastDecisionTime] = useState(Date.now());
  const [isMuted, setIsMuted] = useState(false);
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [lastDirection, setLastDirection] = useState<'left' | 'right' | null>(null);
  const [undoUsedForCurrent, setUndoUsedForCurrent] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Top-level motion values
  const dragX = useMotionValue(0);
  const rotate = useTransform(dragX, [-200, 200], [-15, 15]);
  const opacity = useTransform(dragX, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  
  // Visual cue opacities
  const preferOpacity = useTransform(dragX, [0, 100], [0, 1]);
  const rejectOpacity = useTransform(dragX, [0, -100], [0, 1]);

  const playSwipeSound = useCallback(() => {
    if (!isMuted) {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    }
  }, [isMuted]);

  useEffect(() => {
    const activePool = library.filter(img => img.isActive !== false);
    const randomized = [...activePool].sort(() => Math.random() - 0.5);
    setSessionStack(randomized.slice(0, settings.sessionLength));
    setLastDecisionTime(Date.now());
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [library, settings]);

  const handleSwipe = (direction: 'left' | 'right') => {
    const now = Date.now();
    const currentImg = sessionStack[currentIndex];
    
    setLastDirection(direction);

    const decision: SwipeDecision = {
      imageId: currentImg.id,
      direction,
      responseTimeMs: now - lastDecisionTime,
      undoUsed: undoUsedForCurrent,
      roomType: currentImg.roomType,
      styleCategories: currentImg.styleCategories,
    };

    const newDecisions = [...decisions, decision];
    setDecisions(newDecisions);
    setUndoAvailable(true);
    setUndoUsedForCurrent(false);
    playSwipeSound();
    
    if (currentIndex < sessionStack.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setLastDecisionTime(now);
      dragX.set(0);
    } else {
      const summary = analyzeSession(newDecisions, settings.categories);
      onComplete({
        id: crypto.randomUUID(),
        date: Date.now(),
        clientName,
        decisions: newDecisions,
        summary,
      });
    }
  };

  const handleUndo = () => {
    if (!undoAvailable || currentIndex === 0) return;
    setLastDirection(null);
    setDecisions(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
    setUndoAvailable(false);
    setUndoUsedForCurrent(true);
    setLastDecisionTime(Date.now());
    dragX.set(0);
  };

  if (sessionStack.length === 0) return null;

  const progressPercentage = (currentIndex / sessionStack.length) * 100;

  return (
    <div className="fixed inset-0 bg-[#f4f1ea] z-[60] flex flex-col overflow-hidden">
      <div className="pt-16 pb-6 px-6 bg-[#f4f1ea]/95 backdrop-blur-md z-[100] ios-shadow border-b border-[#dfd9ce]">
        <div className="flex justify-between items-center mb-6">
          <button onClick={onCancel} className="p-2 -ml-2 text-[#a39e93] active:scale-90 transition-transform">
            <X size={20} />
          </button>
          <div className="flex flex-col items-center">
             <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#a39e93]">Discovery</span>
             <span className="serif text-xs italic mt-0.5">{clientName ? `Vision for ${clientName}` : 'Explore your vision'}</span>
          </div>
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 -mr-2 text-[#a39e93] active:scale-90 transition-transform">
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <div className="px-4 space-y-2">
          <div className="flex justify-between items-baseline">
             <span className="text-[8px] uppercase tracking-[0.4em] font-bold text-[#c9c4b9]">Progress</span>
             <div className="flex items-baseline gap-1">
               <span className="serif text-lg text-[#3d3935] leading-none tabular-nums">{currentIndex + 1}</span>
               <span className="text-[8px] font-bold text-[#c9c4b9] tracking-widest leading-none">/ {sessionStack.length}</span>
             </div>
          </div>
          <div className="h-[2px] w-full bg-[#ede8df] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#3d3935]"
              initial={false}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 relative px-6 overflow-visible flex items-center justify-center">
        {currentIndex + 1 < sessionStack.length && (
           <div className="absolute inset-x-10 top-1/2 -translate-y-[52%] h-[60vh] opacity-10 scale-[0.92] translate-y-8 pointer-events-none transition-all duration-700">
              <div className="w-full h-full bg-[#ede8df] rounded-[2.5rem] overflow-hidden ios-shadow border border-[#dfd9ce]">
                 <img src={sessionStack[currentIndex + 1].url} className="w-full h-full object-cover grayscale blur-[2px]" />
              </div>
           </div>
        )}

        <AnimatePresence mode="popLayout" custom={lastDirection}>
          <motion.div
            key={sessionStack[currentIndex].id}
            custom={lastDirection}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            style={{ x: dragX, rotate, opacity }}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1.1}
            onDragEnd={(_, info) => {
              const threshold = 120;
              const velocityThreshold = 500;
              if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
                handleSwipe('right');
              } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
                handleSwipe('left');
              }
            }}
            className="absolute w-[calc(100%-3rem)] h-[60vh] flex items-center justify-center touch-none cursor-grab active:cursor-grabbing"
          >
            <SwipeCard image={sessionStack[currentIndex]} />
            <motion.div style={{ opacity: preferOpacity }} className="absolute top-10 right-10 bg-[#faf8f2]/90 backdrop-blur rounded-full p-4 ios-shadow pointer-events-none">
              <Heart size={32} className="text-[#3d3935] fill-[#3d3935]" />
            </motion.div>
            <motion.div style={{ opacity: rejectOpacity }} className="absolute top-10 left-10 bg-[#faf8f2]/90 backdrop-blur rounded-full p-4 ios-shadow pointer-events-none">
              <X size={32} className="text-[#a39e93]" />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="pb-16 pt-8 flex justify-center items-center gap-10 bg-[#f4f1ea] z-[80]">
        <button onClick={() => handleSwipe('left')} className="flex flex-col items-center gap-2 group transition-all">
          <div className="w-16 h-16 rounded-full border border-[#dfd9ce] flex items-center justify-center text-[#c9c4b9] bg-[#faf8f2] ios-shadow active:scale-90 hover:text-[#3d3935] hover:border-[#dfd9ce] transition-all">
            <X size={28} strokeWidth={1} />
          </div>
          <span className="text-[8px] uppercase tracking-widest font-bold text-[#a39e93]">Reject</span>
        </button>
        <button onClick={handleUndo} disabled={!undoAvailable} className={`flex flex-col items-center gap-2 transition-all ${undoAvailable ? 'opacity-100' : 'opacity-20 grayscale cursor-not-allowed'}`}>
          <div className="w-12 h-12 rounded-full border border-[#3d3935] flex items-center justify-center text-[#3d3935] bg-[#faf8f2] ios-shadow active:scale-90 transition-transform">
            <Undo2 size={18} strokeWidth={1.5} />
          </div>
          <span className="text-[8px] uppercase tracking-widest font-bold">Undo</span>
        </button>
        <button onClick={() => handleSwipe('right')} className="flex flex-col items-center gap-2 group transition-all">
          <div className="w-16 h-16 rounded-full border border-[#dfd9ce] flex items-center justify-center text-[#3d3935] bg-[#faf8f2] ios-shadow active:scale-90 hover:border-[#dfd9ce] transition-all">
            <Heart size={28} strokeWidth={1} className="group-hover:fill-[#3d3935] group-active:fill-[#3d3935] transition-colors" />
          </div>
          <span className="text-[8px] uppercase tracking-widest font-bold text-[#3d3935]">Prefer</span>
        </button>
      </div>
    </div>
  );
};