import { useState, useEffect } from 'react';

interface AppLockProps {
  onUnlock: () => void;
}

export function AppLock({ onUnlock }: AppLockProps) {
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const MASTER_PIN = '0070';

  const handleDigit = (digit: string) => {
    if (isError || isSuccess || pin.length >= 4) return;

    const nextPin = pin + digit;
    setPin(nextPin);

    if (nextPin.length === 4) {
      if (nextPin === MASTER_PIN) {
        setIsSuccess(true);
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(40);
        setTimeout(() => {
          onUnlock();
        }, 650); // 650ms lets the 420ms 3D fold finish with a clean pause
      } else {
        setIsError(true);
        if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 40, 50]);
        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 500);
      }
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
        handleDigit(e.key);
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
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '340px', 
          margin: '0 auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          userSelect: 'none' 
        }}
      >
        {/* Embedded Fail-Safe Keyframes */}
        <style>{`
          @keyframes vaultJitter {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-9px); }
            40% { transform: translateX(9px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
          @keyframes shacklePop {
            0% { transform: translateY(0); }
            50% { transform: translateY(-4px) rotate(-6deg); }
            100% { transform: translateY(-5px) rotate(-12deg); }
          }
          @keyframes cinematicTitleFlip {
            0% {
              opacity: 0;
              transform: perspective(600px) rotateX(65deg) translateY(-8px) scale(0.92);
              filter: blur(5px);
              letter-spacing: 0.45em;
            }
            60% {
              filter: blur(0px);
            }
            100% {
              opacity: 1;
              transform: perspective(600px) rotateX(0deg) translateY(0) scale(1);
              filter: blur(0px);
              letter-spacing: 0.22em;
            }
          }
          .vault-jitter { animation: vaultJitter 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
          .shackle-animated { animation: shacklePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: right top; }
          .metallic-cinematic-title {
            background: linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 35%, #94A3B8 75%, #CBD5E1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 1px 12px rgba(255, 255, 255, 0.22);
            animation: cinematicTitleFlip 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transform-origin: center bottom;
            display: inline-block;
          }
        `}</style>

        {/* Dynamic Padlock Icon */}
        <div className="relative mb-3 transition-transform duration-300">
          <div 
            style={{
              position: 'absolute',
              inset: '-8px',
              borderRadius: '9999px',
              filter: 'blur(14px)',
              opacity: 0.35,
              transition: 'all 0.3s ease',
              backgroundColor: isError ? '#f43f5e' : isSuccess ? '#10b981' : '#f59e0b'
            }}
          />
          <svg 
            style={{ 
              width: '46px', 
              height: '46px',
              color: isError ? '#f43f5e' : isSuccess ? '#34d399' : '#fbbf24',
              transition: 'color 0.25s ease'
            }} 
            className="relative mx-auto" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            {/* Animated Shackle */}
            <path 
              className={isSuccess ? 'shackle-animated' : ''}
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d={isSuccess 
                ? "M8 11V7a4 4 0 118 0" 
                : "M8 11V7a4 4 0 018 0v4"
              } 
            />
            {/* Padlock Body */}
            <rect x="5" y="11" width="14" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>

        {/* Vault State Banner */}
        <div 
          style={{ 
            height: '24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            marginBottom: '28px' 
          }}
        >
          {isSuccess ? (
            <span className="metallic-cinematic-title font-mono text-[11px] font-extrabold uppercase select-none">
              WELCOME BACK, ABHIRAJ
            </span>
          ) : isError ? (
            <span className="text-rose-400 font-mono text-[11px] font-bold tracking-[0.28em] uppercase">
              ACCESS DENIED
            </span>
          ) : (
            <span className="text-amber-400 font-mono text-[11px] font-bold tracking-[0.28em] uppercase">
              VAULT LOCKED
            </span>
          )}
        </div>

        {/* Dynamic High-Feedback Dots */}
        <div 
          className={isError ? 'vault-jitter' : ''}
          style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '36px' }}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                style={{ 
                  width: '14px', 
                  height: '14px',
                  borderRadius: '9999px',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFilled ? 'scale(1.15)' : 'scale(1)',
                  backgroundColor: isFilled
                    ? isError ? '#f43f5e' : isSuccess ? '#10b981' : '#22d3ee'
                    : 'rgba(15, 23, 42, 0.9)',
                  border: isFilled 
                    ? 'none' 
                    : '1px solid rgba(51, 65, 85, 0.9)',
                  boxShadow: isFilled
                    ? isError
                      ? '0 0 12px #f43f5e'
                      : isSuccess
                      ? '0 0 14px #34d399'
                      : '0 0 12px rgba(34, 211, 238, 0.85)'
                    : 'none'
                }}
              />
            );
          })}
        </div>

        {/* Locked 3-Column Grid (78px Circular Keys) */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 78px)', 
            gap: '20px', 
            justifyContent: 'center' 
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(num)}
              style={{ width: '78px', height: '78px', fontSize: '1.75rem' }}
              className="rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-100 font-medium flex items-center justify-center transition-all duration-100 hover:border-cyan-500/40 hover:text-white active:scale-95 active:bg-cyan-500/15 active:border-cyan-400 cursor-pointer shadow-md"
            >
              {num}
            </button>
          ))}

          {/* Row 4: Placeholder */}
          <div style={{ width: '78px', height: '78px' }} />

          {/* Row 4: 0 Key */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{ width: '78px', height: '78px', fontSize: '1.75rem' }}
            className="rounded-full bg-slate-800/60 border border-slate-700/60 text-slate-100 font-medium flex items-center justify-center transition-all duration-100 hover:border-cyan-500/40 hover:text-white active:scale-95 active:bg-cyan-500/15 active:border-cyan-400 cursor-pointer shadow-md"
          >
            0
          </button>

          {/* Row 4: Ghost Delete Key */}
          <button
            type="button"
            onClick={handleDeletePin}
            style={{ 
              width: '78px', 
              height: '78px', 
              backgroundColor: 'transparent', 
              border: 'none' 
            }}
            aria-label="Delete digit"
            className="rounded-full flex items-center justify-center text-slate-400 hover:text-rose-400 active:text-rose-300 active:scale-90 transition-all duration-100 cursor-pointer"
          >
            <svg 
              style={{ width: '32px', height: '32px' }} 
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
