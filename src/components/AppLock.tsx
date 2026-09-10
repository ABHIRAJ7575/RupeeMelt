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
      <div className="w-full max-w-xs mx-auto p-6 rounded-3xl bg-slate-900/95 border border-slate-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.7)] flex flex-col items-center select-none">
        {/* Lock Icon with Subtle Ambient Glow */}
        <div className="relative mb-3">
          <div
            className={`absolute -inset-2 rounded-full blur-md opacity-30 transition-all duration-300 ${
              isError ? 'bg-rose-500' : isSuccess ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          <div className="relative text-3xl">
            {isSuccess ? '🔓' : '🔒'}
          </div>
        </div>

        <h2 className="text-[11px] font-mono font-bold tracking-[0.2em] uppercase mb-6 transition-colors duration-200">
          {isError ? (
            <span className="text-rose-400">INCORRECT PIN</span>
          ) : isSuccess ? (
            <span className="text-emerald-400">UNLOCKED</span>
          ) : (
            <span className="text-amber-400">VAULT LOCKED</span>
          )}
        </h2>

        {/* PIN Dots */}
        <div className={`flex items-center gap-3.5 mb-8 ${isError ? 'animate-vault-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  isFilled
                    ? isError
                      ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e] animate-dot-glow'
                      : isSuccess
                      ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-dot-glow'
                      : 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)] animate-dot-glow'
                    : 'bg-slate-800/80 border border-slate-700/60'
                }`}
              />
            );
          })}
        </div>

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 64px)', 
            gap: '16px', 
            justifyContent: 'center',
            margin: '0 auto' 
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handlePinInput(num)}
              style={{ width: '64px', height: '64px' }}
              className="rounded-full bg-slate-900/90 border border-slate-800 text-white text-xl font-medium flex items-center justify-center active:bg-slate-800"
            >
              {num}
            </button>
          ))}

          {/* Empty bottom-left placeholder */}
          <div style={{ width: '64px', height: '64px' }} />

          {/* 0 Button */}
          <button
            type="button"
            onClick={() => handlePinInput('0')}
            style={{ width: '64px', height: '64px' }}
            className="rounded-full bg-slate-900/90 border border-slate-800 text-white text-xl font-medium flex items-center justify-center active:bg-slate-800"
          >
            0
          </button>

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDeletePin}
            style={{ width: '64px', height: '64px' }}
            className="rounded-full flex items-center justify-center text-slate-400 active:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0110.828 5H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.172a2 2 0 01-1.414-.586L3 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
