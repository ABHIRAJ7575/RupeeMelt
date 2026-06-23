import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, IconButton, ThemeProvider, createTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

import { MetallicCard } from './components/ui/MetallicCard';
import Odometer from './components/ui/Odometer';
import { ParticleEngine } from './components/ui/ParticleEngine';
import { FinancialEngine } from './components/ledger/FinancialEngine';
import { FloatingCalculator } from './components/tools/FloatingCalculator';
import { generateLedgerReport } from './lib/pdfGenerator';
import { supabase } from './lib/supabase';
import type { LedgerTransaction } from './lib/supabase';

// Happy Dark Theme Palette Overrides
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FBBF24', // Glowing Gold
    },
    secondary: {
      main: '#38BDF8', // Light Blue accent
    },
    success: {
      main: '#10B981', // Neon Emerald
    },
    error: {
      main: '#F43F5E', // Vibrant Rose
    },
    background: {
      default: '#0B1120',
      paper: '#0F172A',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    }
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        }
      }
    }
  }
});

export default function App() {
  const [isIncognito, setIsIncognito] = useState(false);
  
  // Data Purity: Initialized to strictly 0
  const [cashOnHandPaisa, setCashOnHandPaisa] = useState(0); 
  const [totalExpensesPaisa, setTotalExpensesPaisa] = useState(0); 
  const [totalInflowPaisa, setTotalInflowPaisa] = useState(0); 
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const totalNetBalancePaisa = totalInflowPaisa - totalExpensesPaisa;

  // Reset Ledger Protocol States
  const [resetStage, setResetStage] = useState<0 | 1 | 2>(0);
  const [transactionAnim, setTransactionAnim] = useState<'deposit' | 'withdraw' | null>(null);

  const playCoinSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      // Sharp high pitch for a coin clink
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) { console.error("Audio not supported"); }
  };

  const fetchLedger = async () => {
    const { data, error } = await supabase.from('user_ledger').select('*');
    if (error) {
      console.error('Error fetching ledger:', error);
      return;
    }
    
    if (data) {
      const metrics = data.reduce((acc, t) => {
        const amount = Number(t.amount_paisa);
        if (t.transaction_direction === 'outflow') {
          acc.expenses += amount;
          if (t.payment_method === 'offline') acc.cash -= amount;
        } else {
          acc.inflows += amount;
          if (t.payment_method === 'offline') acc.cash += amount;
        }
        return acc;
      }, { cash: 0, expenses: 0, inflows: 0 });

      setCashOnHandPaisa(metrics.cash);
      setTotalExpensesPaisa(metrics.expenses);
      setTotalInflowPaisa(metrics.inflows);
      setTransactions(data as LedgerTransaction[]);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleRecordTransaction = async (amountPaisa: number, type: 'inflow' | 'outflow', paymentMethod: 'online' | 'offline', category: string, desc: string) => {
    const { error } = await supabase.from('user_ledger').insert({
      amount_paisa: amountPaisa,
      transaction_direction: type,
      payment_method: paymentMethod,
      category,
      description: desc
    });

    if (error) {
      console.error('Error recording transaction:', error);
      return;
    }

    await fetchLedger();

    if (type === 'inflow') {
      playCoinSound();
    }
    
    setTransactionAnim(type === 'inflow' ? 'deposit' : 'withdraw');
    setTimeout(() => {
      setTransactionAnim(null);
    }, 2000);

    console.log(`Recorded to Supabase: ${type} of ₹${amountPaisa/100} via ${paymentMethod} for [${category}] - ${desc}`);
  };

  const handleExport = () => {
    generateLedgerReport('My_Personal_Ledger', transactions);
  };

  const executeSarcasticReset = async () => {
    // Stage 3: Actual Wipe
    console.warn("Executing Supabase DELETE * FROM user_ledger...");
    const { error } = await supabase.from('user_ledger').delete().neq('amount_paisa', -1);
    if (error) {
      console.error('Error wiping ledger:', error);
    } else {
      fetchLedger();
    }
    setResetStage(0);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <ParticleEngine />
      
      <Container maxWidth={false} sx={{ maxWidth: 'var(--app-max-width)', py: 'clamp(2rem, 4cqi, 4rem)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 4cqi, 4rem)', position: 'relative', zIndex: 10 }}>
        {/* Header Pipeline */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              component="span"
              sx={{ 
                fontFamily: "'Outfit', sans-serif",
                fontSize: 'clamp(2.5rem, 6cqi, 4rem)',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FBBF24 0%, #F97316 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 12px rgba(251, 191, 36, 0.6))',
                lineHeight: 1
              }}
            >
              ₹
            </Typography>
            <Box>
              <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 'var(--font-size-h3)', color: 'rgba(255, 255, 255, 0.95)' }}>
                RupeeMelt
              </Typography>
              <Typography variant="body1" sx={{ fontSize: 'var(--font-size-base)', color: '#94A3B8' }}>
                Precision Mathematical Ledger
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <IconButton onClick={() => setIsIncognito(!isIncognito)} color="secondary" sx={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(255,255,255,0.1)' }}>
              {isIncognito ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExport}
              sx={{ px: 3 }}
            >
              Export
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteForeverIcon />}
              onClick={() => setResetStage(1)}
              sx={{ px: 3, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
            >
              Reset Ledger
            </Button>
          </Box>
        </Box>

        {/* Top Metrics Section (4-Card Grid) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
          <MetallicCard sx={{ 
            p: 4, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 1, 
            height: '100%',
            boxShadow: 'inset 0 0 40px rgba(251, 191, 36, 0.1), 0 24px 48px rgba(0, 0, 0, 0.4)',
            borderTop: '1px solid rgba(251, 191, 36, 0.4)' 
          }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: 'var(--font-size-base)' }}>
              Total Net Balance
            </Typography>
            <Typography 
              variant="h2" 
              color="primary.main" 
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 'var(--font-size-h2)' }}
            >
              <Odometer amount={totalNetBalancePaisa} />
            </Typography>
          </MetallicCard>

          <MetallicCard sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: 'var(--font-size-base)' }}>
              Total Inflows
            </Typography>
            <Typography 
              variant="h2" 
              color="success.main" 
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 'var(--font-size-h2)' }}
            >
              <Odometer amount={totalInflowPaisa} />
            </Typography>
          </MetallicCard>

          <MetallicCard sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: 'var(--font-size-base)' }}>
              Total Expenses
            </Typography>
            <Typography 
              variant="h2" 
              color="error.main" 
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 'var(--font-size-h2)' }}
            >
              <Odometer amount={totalExpensesPaisa} />
            </Typography>
          </MetallicCard>

          <MetallicCard sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 1, height: '100%' }}>
            <Typography variant="h6" color="text.secondary" sx={{ fontSize: 'var(--font-size-base)' }}>
              Cash on Hand (Offline)
            </Typography>
            <Typography 
              variant="h2" 
              color="secondary.main" 
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: 'var(--font-size-h2)' }}
            >
              <Odometer amount={cashOnHandPaisa} />
            </Typography>
          </MetallicCard>
        </Box>

        {/* Central Transaction Console */}
        <Box className="dashboard-grid">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3cqi, 3rem)' }}>
            <FinancialEngine onRecordTransaction={handleRecordTransaction} />
          </Box>
        </Box>
      </Container>
      
      {/* Floating Global Utilities */}
      <FloatingCalculator />

      {/* Reset Ledger Modals */}
      <Dialog 
        open={resetStage === 1} 
        onClose={() => setResetStage(0)}
        sx={{ '& .MuiDialog-paper': { background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid #F43F5E' } }}
      >
        <DialogTitle sx={{ color: '#F43F5E', fontWeight: 700 }}>Critical Warning</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to completely wipe your financial history? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetStage(0)} color="inherit">Cancel</Button>
          <Button onClick={() => setResetStage(2)} color="error" variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={resetStage === 2} 
        onClose={() => setResetStage(0)}
        sx={{ '& .MuiDialog-paper': { background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid #F43F5E' } }}
      >
        <DialogTitle sx={{ color: '#F43F5E', fontWeight: 700 }}>Final Sarcastic Warning</DialogTitle>
        <DialogContent>
          <Typography>Wow, you didn't even hesitate when approving twice!! Wiping everything now... don't blame me!</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setResetStage(0)} color="inherit">Wait, cancel!</Button>
          <Button onClick={executeSarcasticReset} color="error" variant="contained">Do it</Button>
        </DialogActions>
      </Dialog>

      {transactionAnim && (
        <Box sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999,
          backdropFilter: 'blur(6px)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Box sx={{
            width: 160, height: 160,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'coinPop 2s ease-out forwards',
            background: transactionAnim === 'deposit' 
              ? 'linear-gradient(135deg, #FBBF24, #D97706)' 
              : 'linear-gradient(135deg, #475569, #1E293B)',
            boxShadow: transactionAnim === 'deposit'
              ? '0 0 40px rgba(251, 191, 36, 0.6)'
              : '0 0 40px rgba(71, 85, 105, 0.6)'
          }}>
            <Typography sx={{ 
              fontSize: '5rem', 
              fontWeight: 800, 
              color: transactionAnim === 'deposit' ? '#10B981' : '#F43F5E',
              filter: `drop-shadow(0 0 10px ${transactionAnim === 'deposit' ? '#10B981' : '#F43F5E'})`
            }}>
              ₹
            </Typography>
          </Box>
        </Box>
      )}

    </ThemeProvider>
  );
}
