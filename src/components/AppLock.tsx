import { useState, useEffect } from 'react';

interface AppLockProps {
  onUnlock: () => void;
}

export function AppLock({ onUnlock }: AppLockProps) {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const MASTER_PIN = '0070';

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === MASTER_PIN) {
        setIsSuccess(true);
        const timer = setTimeout(() => {
          onUnlock();
        }, 350);
        return () => clearTimeout(timer);
      } else {
        setIsError(true);
        const timer = setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 450);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, onUnlock]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4 && !isSuccess && !isError) {
      setPin(prev => prev + digit);
    }
  };

  const handleDeletePin = () => {
    if (!isSuccess && !isError) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handlePinInput(e.key);
      } else if (e.key === 'Backspace') {
        handleDeletePin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isSuccess, isError]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0E14',
        padding: '1rem',
      }}
    >
      <div className="w-full max-w-[280px] mx-auto flex flex-col items-center select-none">
        {/* Lock Icon */}
        <div className="text-amber-400 mb-2">
          <svg className="w-9 h-9 mx-auto drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Header */}
        <h2 className="text-[11px] font-mono font-bold tracking-[0.25em] text-amber-400/90 uppercase mb-6">
          VAULT LOCKED
        </h2>

        {/* High-Contrast PIN Dots */}
        <div className="flex items-center gap-3.5 mb-8">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] scale-110'
                    : 'bg-slate-900/80 border border-slate-700/80'
                }`}
              />
            );
          })}
        </div>

        {/* Strict 3-Column Grid */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 64px)', 
            gap: '16px', 
            justifyContent: 'center' 
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handlePinInput(num)}
              style={{ width: '64px', height: '64px' }}
              className="rounded-full bg-slate-800/50 border border-slate-700/60 text-slate-100 text-xl font-medium flex items-center justify-center transition-all duration-100 hover:border-cyan-500/40 hover:text-white active:scale-95 active:bg-cyan-500/10 active:border-cyan-400"
            >
              {num}
            </button>
          ))}

          {/* Row 4: Empty slot */}
          <div style={{ width: '64px', height: '64px' }} />

          {/* Row 4: Number 0 */}
          <button
            type="button"
            onClick={() => handlePinInput('0')}
            style={{ width: '64px', height: '64px' }}
            className="rounded-full bg-slate-800/50 border border-slate-700/60 text-slate-100 text-xl font-medium flex items-center justify-center transition-all duration-100 hover:border-cyan-500/40 hover:text-white active:scale-95 active:bg-cyan-500/10 active:border-cyan-400"
          >
            0
          </button>

          {/* Row 4: Concept B Ghost Backspace Key (Borderless) */}
          <button
            type="button"
            onClick={handleDeletePin}
            style={{ 
              width: '64px', 
              height: '64px', 
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none'
            }}
            aria-label="Delete digit"
            className="rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 active:text-rose-300 active:scale-90 transition-all duration-100 cursor-pointer"
          >
            <svg 
              style={{ width: '26px', height: '26px' }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0110.828 5H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.172a2 2 0 01-1.414-.586L3 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
