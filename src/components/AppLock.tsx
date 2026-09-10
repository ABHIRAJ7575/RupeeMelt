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
        {/* 1. DEFINE SHARED METALLIC STYLES & SVG GRADIENTS */}
        <style>{`
          /* Brushed Titanium / Liquid Chrome Gradient */
          .metallic-text {
            background: linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 25%, #94A3B8 55%, #CBD5E1 85%, #64748B 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
          }

          /* Metallic Text for Access Denied State */
          .metallic-text-error {
            background: linear-gradient(180deg, #FECDD3 0%, #FB7185 35%, #E11D48 70%, #9F1239 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            filter: drop-shadow(0 0 8px rgba(244, 63, 94, 0.4));
          }

          /* Cinematic Unfold Animation for Welcome Title */
          @keyframes cinematicTitleFlip {
            0% {
              opacity: 0;
              transform: perspective(600px) rotateX(65deg) translateY(-8px) scale(0.92);
              filter: blur(4px);
              letter-spacing: 0.4em;
            }
            100% {
              opacity: 1;
              transform: perspective(600px) rotateX(0deg) translateY(0) scale(1);
              filter: blur(0px);
              letter-spacing: 0.22em;
            }
          }

          .metallic-cinematic-title {
            animation: cinematicTitleFlip 0.42s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            transform-origin: center bottom;
            display: inline-block;
          }

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
          .vault-jitter { animation: vaultJitter 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
          .shackle-animated { animation: shacklePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; transform-origin: right top; }
        `}</style>

        {/* Hidden SVG Gradient Definition for Icons */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <linearGradient id="metallicIconGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="25%" stopColor="#E2E8F0" />
              <stop offset="55%" stopColor="#94A3B8" />
              <stop offset="85%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="metallicErrorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FECDD3" />
              <stop offset="40%" stopColor="#FB7185" />
              <stop offset="100%" stopColor="#E11D48" />
            </linearGradient>
          </defs>
        </svg>

        {/* Clean Metallic Lock Icon (No Backlight Aura) */}
        <div className="mb-3 transition-transform duration-300">
          <svg 
            style={{ width: '46px', height: '46px' }} 
            className="mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke={isError ? "url(#metallicErrorGrad)" : "url(#metallicIconGrad)"} 
            strokeWidth={2}
          >
            <path 
              className={isSuccess ? 'shackle-animated' : ''}
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d={isSuccess ? "M8 11V7a4 4 0 118 0" : "M8 11V7a4 4 0 018 0v4"} 
            />
            <rect x="5" y="11" width="14" height="10" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="16" r="1" fill={isError ? "url(#metallicErrorGrad)" : "url(#metallicIconGrad)"} />
          </svg>
        </div>

        {/* 3. METALLIC TEXT BANNER (Locked / Denied / Welcome) */}
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
            <span className="metallic-text metallic-cinematic-title font-mono text-[11px] font-extrabold uppercase select-none tracking-[0.22em]">
              WELCOME BACK, ABHIRAJ
            </span>
          ) : isError ? (
            <span className="metallic-text-error font-mono text-[11px] font-bold tracking-[0.28em] uppercase select-none">
              ACCESS DENIED
            </span>
          ) : (
            <span className="metallic-text font-mono text-[11px] font-bold tracking-[0.28em] uppercase select-none">
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

        {/* 4. METALLIC NUMERIC KEYPAD & GHOST BACKSPACE */}
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
              style={{ width: '78px', height: '78px' }}
              className="rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center transition-all duration-100 hover:border-slate-500 hover:bg-slate-800/90 active:scale-95 active:border-cyan-400 cursor-pointer shadow-md"
            >
              <span className="metallic-text text-[1.75rem] font-semibold leading-none pointer-events-none">
                {num}
              </span>
            </button>
          ))}

          {/* Row 4: Empty Slot */}
          <div style={{ width: '78px', height: '78px' }} />

          {/* Row 4: Number 0 */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            style={{ width: '78px', height: '78px' }}
            className="rounded-full bg-slate-800/60 border border-slate-700/60 flex items-center justify-center transition-all duration-100 hover:border-slate-500 hover:bg-slate-800/90 active:scale-95 active:border-cyan-400 cursor-pointer shadow-md"
          >
            <span className="metallic-text text-[1.75rem] font-semibold leading-none pointer-events-none">
              0
            </span>
          </button>

          {/* Row 4: Metallic Ghost Delete Key */}
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
            className="rounded-full flex items-center justify-center active:scale-90 transition-all duration-100 cursor-pointer"
          >
            <svg 
              style={{ width: '32px', height: '32px' }} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="url(#metallicIconGrad)" 
              strokeWidth={2}
              className="drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0110.828 5H20a2 2 0 012 2v10a2 2 0 01-2 2h-9.172a2 2 0 01-1.414-.586L3 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
