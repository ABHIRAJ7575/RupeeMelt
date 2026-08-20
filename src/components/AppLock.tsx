import { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
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
        setTimeout(() => {
          setErrorShake(false);
          setPin('');
        }, 500);
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

  const handleBiometricAuth = async () => {
    if (!window.PublicKeyCredential) {
      alert("Biometrics not supported on this device/browser.");
      return;
    }

    try {
      // In a real application, you would request challenge from the server
      const challenge = new Uint8Array(32);
      window.crypto.getRandomValues(challenge);

      // Using a basic PublicKeyCredential check for local authentication.
      // We simulate local presence verification.
      // Note: Full WebAuthn involves registered credentials. 
      // For a frictionless local app lock intercept, we can use "conditional mediation" or 
      // rely on an assertion request. Since we don't have a registered credential for this user yet, 
      // we'll use a dummy assertion. Some browsers might fail this if no credential is registered.
      // Alternatively, we can just use the existence of the API to show the flow, but to make it actually pop up 
      // the screen lock without prior registration is tricky on web. 
      // We will attempt a standard 'get' request, which usually prompts the OS UI if credentials exist.
      // To ensure it doesn't just instantly fail, we'll try/catch it.

      const credentialRequestOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challenge,
          timeout: 60000,
          userVerification: "required",
          // allowCredentials would normally be populated here.
          // Leaving it empty prompts the user to select an available passkey/local credential if supported.
        }
      };

      const credential = await navigator.credentials.get(credentialRequestOptions);
      if (credential) {
        onUnlock();
      }
    } catch (err) {
      console.error("Biometric auth failed or cancelled:", err);
      // In many environments (like desktop without passkeys setup), this will fail.
      // We log it but do not crash.
    }
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
          gap: 4,
          width: '100%',
          maxWidth: '400px',
          animation: errorShake ? 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both' : 'none',
          '@keyframes shake': {
            '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
            '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
            '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
            '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
          }
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
        <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
          {[0, 1, 2, 3].map((index) => (
            <Box
              key={index}
              sx={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: pin.length > index ? '#FACC15' : 'rgba(148, 163, 184, 0.2)',
                boxShadow: pin.length > index ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none',
                transition: 'all 0.2s ease'
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
              sx={{
                height: '72px',
                borderRadius: '50%',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#F8FAFC',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                background: 'rgba(30, 38, 56, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                '&:hover': {
                  background: 'rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.3)',
                },
                transition: 'all 0.1s ease',
              }}
            >
              {num}
            </Button>
          ))}
          <Box /> {/* Empty cell for grid alignment */}
          <Button
            onClick={() => handleKeyPress('0')}
            sx={{
              height: '72px',
              borderRadius: '50%',
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#F8FAFC',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              background: 'rgba(30, 38, 56, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              '&:hover': {
                background: 'rgba(245, 158, 11, 0.1)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
              }
            }}
          >
            0
          </Button>
          <IconButton
            onClick={handleDelete}
            sx={{
              color: '#94A3B8',
              '&:hover': { color: '#F43F5E', background: 'rgba(244, 63, 94, 0.1)' }
            }}
          >
            <BackspaceOutlinedIcon />
          </IconButton>
        </Box>

        {/* Biometric Button */}
        <Button
          onClick={handleBiometricAuth}
          startIcon={<FingerprintIcon />}
          fullWidth
          sx={{
            mt: 3,
            py: 1.5,
            color: '#38BDF8',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '8px',
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: '1px',
            fontWeight: 600,
            '&:hover': {
              background: 'rgba(56, 189, 248, 0.2)',
              borderColor: 'rgba(56, 189, 248, 0.4)',
            }
          }}
        >
          USE BIOMETRICS
        </Button>
      </Box>
    </Box>
  );
}
