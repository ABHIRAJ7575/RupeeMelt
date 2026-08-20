import { useState } from 'react';
import { Box, Button, Typography, Container } from '@mui/material';
import { supabase } from '../lib/supabase';

export function MasterLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError('[!] ACCESS DENIED - INVALID CREDENTIALS');
    }
    
    setLoading(false);
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
      }}
    >
      <Container maxWidth="sm">
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245, 158, 11, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            borderRadius: 0,
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {/* Massive Logo */}
          <Typography
            component="span"
            sx={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '5rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #FACC15, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
              filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.2))',
            }}
          >
            ₹
          </Typography>

          <Typography
            sx={{
              fontFamily: "'JetBrains Mono', monospace",
              color: '#FACC15',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textAlign: 'center',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
            }}
          >
            SYSTEM SECURED: AUTHENTICATION REQUIRED
          </Typography>

          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Email Address
              </Typography>
              <Box
                component="input"
                type="email"
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                sx={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #334155',
                  borderRadius: 0,
                  color: '#F8FAFC',
                  padding: '12px 0',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: "'JetBrains Mono', monospace",
                  '&:focus': {
                    borderBottomColor: '#FACC15',
                  }
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.7rem', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
                Master Password
              </Typography>
              <Box
                component="input"
                type="password"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                sx={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '2px solid #334155',
                  borderRadius: 0,
                  color: '#F8FAFC',
                  padding: '12px 0',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  fontFamily: "'JetBrains Mono', monospace",
                  '&:focus': {
                    borderBottomColor: '#FACC15',
                  }
                }}
              />
            </Box>
          </Box>

          {error && (
            <Typography sx={{ color: '#EF4444', fontFamily: "'JetBrains Mono', monospace", textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1px' }}>
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              mt: 2,
              py: 1.5,
              background: 'linear-gradient(135deg, #FACC15 0%, #F59E0B 100%)',
              color: '#000',
              fontWeight: 800,
              fontSize: '1rem',
              letterSpacing: '2px',
              borderRadius: '4px',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              boxShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)',
                boxShadow: '0 0 15px rgba(250, 204, 21, 0.4)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            {loading ? 'DECRYPTING...' : 'DECRYPT VAULT'}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
