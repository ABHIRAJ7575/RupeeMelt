import { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

interface AppLockProps {
  onUnlock: () => void;
}

export function AppLock({ onUnlock }: AppLockProps) {
  const [pin, setPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState(false);

  const MASTER_PIN = '0070';

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === MASTER_PIN) {
        onUnlock();
      } else {
        setErrorShake(true);
        setPin(''); // Instantly clear
        setTimeout(() => {
          setErrorShake(false);
        }, 400); // Wait for shake animation to complete
      }
    }
  }, [pin, onUnlock]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0E14',
        p: 2,
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      <Box
        sx={{
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          willChange: 'transform, opacity',
          border: '1px solid rgba(245, 158, 11, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '40px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          width: '100%',
          maxWidth: '400px',
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <LockOutlinedIcon sx={{ color: '#FACC15', fontSize: '3rem', filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.3))' }} />
          <Typography
            sx={{
              color: '#FACC15',
              fontWeight: 700,
              letterSpacing: '0.15em',
              fontSize: '1rem',
              fontFamily: "'JetBrains Mono', monospace",
              mt: 1
            }}
          >
            VAULT LOCKED
          </Typography>
        </Box>

        {/* PIN Dots */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            my: 2,
            animation: errorShake ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none',
            '@keyframes shake': {
              '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
              '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
              '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
              '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
            }
          }}
        >
          {[0, 1, 2, 3].map((index) => (
            <Box
              key={index}
              sx={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: pin.length > index ? '#FACC15' : 'rgba(148, 163, 184, 0.2)',
                boxShadow: pin.length > index ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none',
                transition: 'none'
              }}
            />
          ))}
        </Box>

        {/* Numpad Grid */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 2,
          width: '100%',
          maxWidth: '280px',
        }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disableRipple
              sx={{
                height: '72px',
                borderRadius: '50%',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#F8FAFC',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: 'rgba(30, 38, 56, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'transform 0.1s ease, background-color 0.1s',
                '&:hover': {
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                },
                '&:active': {
                  transform: 'scale(0.92)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              {num}
            </Button>
          ))}
          <Box /> {/* Empty cell for grid alignment */}
          <Button
            onClick={() => handleKeyPress('0')}
            disableRipple
            sx={{
              height: '72px',
              borderRadius: '50%',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#F8FAFC',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'rgba(30, 38, 56, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              transition: 'transform 0.1s ease, background-color 0.1s',
              '&:hover': {
                background: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
              },
              '&:active': {
                transform: 'scale(0.92)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            0
          </Button>
          <IconButton
            onClick={handleDelete}
            disableRipple
            sx={{
              color: '#94A3B8',
              transition: 'transform 0.1s ease, background-color 0.1s',
              '&:hover': { color: '#F43F5E', background: 'rgba(244, 63, 94, 0.1)' },
              '&:active': {
                transform: 'scale(0.92)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <BackspaceOutlinedIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
