import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, ThemeProvider, createTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LockIcon from '@mui/icons-material/Lock';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaymentsIcon from '@mui/icons-material/Payments';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { Session } from '@supabase/supabase-js';

import { MetallicCard } from './components/ui/MetallicCard';
import Odometer from './components/ui/Odometer';
import { ParticleEngine } from './components/ui/ParticleEngine';
import { FinancialEngine } from './components/ledger/FinancialEngine';
import { generateLedgerReport } from './lib/pdfGenerator';
import { supabase } from './lib/supabase';
import type { LedgerTransaction } from './lib/supabase';
import { Document, Page, pdfjs } from 'react-pdf';
import { MasterLogin } from './components/MasterLogin';
import { AppLock } from './components/AppLock';

// Connect the PDF.js worker via external CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FBBF24',
    },
    secondary: {
      main: '#38BDF8',
    },
    success: {
      main: '#10B981', // Electric Emerald
    },
    error: {
      main: '#F43F5E', // Crimson Rose
    },
    background: {
      default: '#0B0E14',
      paper: '#141923',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    }
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    h1: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
    h2: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
    h3: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
    h4: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
    h5: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
    h6: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
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

const eliteTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#F59E0B', // Champagne Gold
    },
    secondary: {
      main: '#3B82F6', // Sapphire Blue
    },
    success: {
      main: '#3B82F6', // Sapphire Blue instead of Emerald for Elite Mode
    },
    error: {
      main: '#F43F5E',
    },
    background: {
      default: '#0B0E14',
      paper: '#141923',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#94A3B8',
    }
  },
  typography: darkTheme.typography,
  components: darkTheme.components
});

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isAppUnlocked, setIsAppUnlocked] = useState(() => {
    return sessionStorage.getItem('vault_unlocked') === 'true';
  });

  const handleSuccessfulUnlock = () => {
    sessionStorage.setItem('vault_unlocked', 'true');
    setIsAppUnlocked(true);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [isEliteVault, setIsEliteVault] = useState(false);
  const [activeCategory, setActiveCategory] = useState<{ name: string; value: number } | null>(null);
  const [tripMembers, setTripMembers] = useState<string[]>(() => JSON.parse(localStorage.getItem('elite_roster') || '[]'));

  const currentRoomId = isEliteVault ? 'Elite_Trip_Vault' : 'My_Personal_Ledger';
  const [isIncognito, setIsIncognito] = useState(() => {
    return localStorage.getItem('rupeeMelt_incognito') === 'true';
  });

  const toggleIncognito = async () => {
    const nextState = !isIncognito;
    setIsIncognito(nextState);

    // Save locally for instant zero-latency boot
    localStorage.setItem('rupeeMelt_incognito', String(nextState));
  };

  // Data Purity: Derived directly from transactions state for instant UI sync
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const { cashOnHandPaisa, totalExpensesPaisa, totalInflowPaisa } = transactions.reduce((acc, t) => {
    const amount = Number(t.amount_paisa);
    if (t.transaction_direction === 'outflow') {
      acc.totalExpensesPaisa += amount;
      if (t.payment_method === 'offline') acc.cashOnHandPaisa -= amount;
    } else {
      acc.totalInflowPaisa += amount;
      if (t.payment_method === 'offline') acc.cashOnHandPaisa += amount;
    }
    return acc;
  }, { cashOnHandPaisa: 0, totalExpensesPaisa: 0, totalInflowPaisa: 0 });

  const totalNetBalancePaisa = totalInflowPaisa - totalExpensesPaisa;

  // Reset Ledger Protocol States
  const [resetStage, setResetStage] = useState<0 | 1 | 2>(0);
  const [vfxMode, setVfxMode] = useState<null | 'deposit' | 'withdraw'>(null);

  // PDF Preview State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfSaveFn, setPdfSaveFn] = useState<(() => void) | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  // ATM Withdrawal State
  const [atmModalOpen, setAtmModalOpen] = useState(false);
  const [atmAmount, setAtmAmount] = useState('');

  const handleAtmWithdrawal = async () => {
    const parsedAmount = parseFloat(atmAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const amountPaisa = Math.round(parsedAmount * 100);

    try {
      // 1. Debit Online (Decreases Total Net Balance initially)
      const debitTx = {
        user_id: session?.user?.id,
        amount_paisa: amountPaisa,
        transaction_direction: 'outflow',
        payment_method: 'online',
        category: 'Internal Transfer',
        description: 'ATM Withdrawal Debit'
      };

      // 2. Credit Offline (Restores Total Net Balance, increases Cash on Hand)
      const creditTx = {
        user_id: session?.user?.id,
        amount_paisa: amountPaisa,
        transaction_direction: 'inflow',
        payment_method: 'offline',
        category: 'Internal Transfer',
        description: 'ATM Withdrawal Credit'
      };

      // Push both to Supabase
      const { error } = await supabase.from('user_ledger').insert([debitTx, creditTx]);

      if (error) {
        console.error('Error during ATM withdrawal:', error);
      } else {
        setAtmModalOpen(false);
        setAtmAmount('');
        playCoinSound();
        fetchTransactions();
      }
    } catch (err) {
      console.error('Exception during ATM withdrawal:', err);
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

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
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.9); // Extended decay
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.9);
    } catch (e) { console.error("Audio not supported"); }
  };

  const playTudumSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const t = audioCtx.currentTime;

    // STRIKE 1: The "Tu" (Quick low-end bass punch)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(60, t);
    osc1.frequency.exponentialRampToValueAtTime(30, t + 0.1);

    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(1.5, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(t);
    osc1.stop(t + 0.15);

    // STRIKE 2: The "Dum" (Massive cinematic synth chord)
    // Deep C major/sus chord frequencies
    const frequencies = [32.7, 65.4, 130.8, 196.0, 261.6, 329.6];

    frequencies.forEach((freq) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      // Warm cinematic lowpass filter sweep
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, t + 0.15);
      filter.frequency.exponentialRampToValueAtTime(3000, t + 0.2);
      filter.frequency.exponentialRampToValueAtTime(100, t + 4.0);

      // ADSR Envelope for the massive tail
      gain.gain.setValueAtTime(0, t + 0.15);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 4.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(t + 0.15);
      osc.stop(t + 4.0);
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
    try {
      await supabase.from('user_ledger').delete().eq('id', id);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const fetchTransactions = async () => {
    // 1. Clear existing UI state instantly
    setTransactions([]);

    // 2. Fetch fresh data for the specific room
    try {
      const { data, error } = await supabase
        .from('user_ledger')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const routedData = data.filter(tx => {
          const isTripTx = tx.description?.includes('[ELITE]');
          return isEliteVault ? isTripTx : !isTripTx;
        });
        setTransactions(routedData as LedgerTransaction[]);
      } else if (error) {
        console.error('Error fetching ledger:', error);
      }
    } catch (error) {
      console.error('Error in fetchTransactions:', error);
    }
  };

  useEffect(() => {
    fetchTransactions();
    setActiveCategory(null);
  }, [isEliteVault]);

  // Save trip members when changed
  useEffect(() => {
    localStorage.setItem('elite_roster', JSON.stringify(tripMembers));
  }, [tripMembers]);

  const expensesByCategory = transactions
    .filter(t => t.transaction_direction === 'outflow')
    .reduce((acc, curr) => {
      let normalizedCategory = curr.category.trim();
      if (normalizedCategory === 'Other') normalizedCategory = 'Others';
      acc[normalizedCategory] = (acc[normalizedCategory] || 0) + curr.amount_paisa / 100;
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.keys(expensesByCategory)
    .map(key => ({
      name: key,
      value: expensesByCategory[key]
    }))
    .sort((a, b) => b.value - a.value);

  const totalExpenseAmount = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

  const handleRecordTransaction = async (amountPaisa: number, type: 'inflow' | 'outflow', paymentMethod: 'online' | 'offline', category: string, desc: string) => {
    try {
      let finalDesc = desc;
      if (isEliteVault) {
        finalDesc = finalDesc ? `${finalDesc} [ELITE]` : '[ELITE]';
      }

      const { error } = await supabase.from('user_ledger').insert({
        user_id: session?.user?.id,
        amount_paisa: amountPaisa,
        transaction_direction: type,
        payment_method: paymentMethod,
        category,
        description: finalDesc
      });

      if (error) {
        console.error('Error recording transaction:', error);
        return;
      }
    } catch (error) {
      console.error('Error recording transaction:', error);
      return;
    }

    await fetchTransactions();

    if (type === 'inflow') {
      playCoinSound();
    } else if (type === 'outflow') {
      playTudumSound();
    }

    setVfxMode(type === 'inflow' ? 'deposit' : 'withdraw');
    setTimeout(() => {
      setVfxMode(null);
    }, 3500);

    console.log(`Recorded to Supabase: ${type} of ₹${amountPaisa / 100} via ${paymentMethod} for [${category}] - ${desc}`);
  };

  const handleExport = () => {
    const { blobUrl, save } = generateLedgerReport(currentRoomId, transactions);
    setPdfPreviewUrl(blobUrl);
    setPdfSaveFn(() => save);
  };

  const executeSarcasticReset = async () => {
    // Stage 3: Actual Wipe
    console.warn("Executing Supabase DELETE * FROM user_ledger...");
    try {
      const idsToDelete = transactions.map(t => t.id);
      if (idsToDelete.length === 0) {
        setResetStage(0);
        return;
      }
      const { error } = await supabase.from('user_ledger').delete().in('id', idsToDelete);
      if (error) {
        console.error('Error wiping ledger:', error);
      } else {
        fetchTransactions();
      }
    } catch (error) {
      console.error('Error wiping ledger:', error);
    }
    setResetStage(0);
  };

  console.log("🔥 RENDER CYCLE -> Vault:", isEliteVault ? "ELITE TRIP" : "PERSONAL", "| Active Room ID:", isEliteVault ? 'Elite_Trip_Vault' : 'My_Personal_Ledger');

  if (!session) {
    return <MasterLogin />;
  }

  if (!isAppUnlocked) {
    return <AppLock onUnlock={handleSuccessfulUnlock} />;
  }

  return (
    <ThemeProvider theme={isEliteVault ? eliteTheme : darkTheme}>
      <Box sx={{ background: isEliteVault ? '#0A0F1C' : '#0B0E14', minHeight: '100vh', transition: 'background 0.5s ease', position: 'relative', overflowX: 'hidden' }}>
        <ParticleEngine />

        <Container
          maxWidth={false}
          className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
          sx={{
            width: '100%',
            maxWidth: '72rem',
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            py: 3,
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(1.5rem, 3cqi, 3rem)',
            position: 'relative',
            zIndex: 10
          }}
        >
          {/* Header Pipeline */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: '100%', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', boxSizing: 'border-box' }}>
              {/* LEFT: Massive Logo */}
              <Box sx={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                filter: 'drop-shadow(0 0 15px rgba(245, 158, 11, 0.4))'
              }}>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: '5rem',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #FACC15, #F59E0B)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 0.8,
                    flexShrink: 0
                  }}
                >
                  ₹
                </Typography>
              </Box>

              {/* RIGHT: Text Stack */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontWeight: 800,
                  fontSize: 'clamp(0.45rem, 2.5vw, 0.7rem)',
                  lineHeight: 1.3,
                  width: '100%',
                  whiteSpace: 'normal',
                  overflowWrap: 'break-word',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  background: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  color: 'transparent',
                  zIndex: 100,
                  marginBottom: '2px'
                }}>
                  Only for personal use of Abhiraj Dixit
                </Typography>

                <Typography variant="h3" sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  fontSize: 'clamp(1.8rem, 8vw, 3rem)',
                  lineHeight: 1,
                  margin: '2px 0'
                }}>
                  RupeeMelt
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    color: isEliteVault ? '#FACC15' : '#94A3B8',
                    backgroundColor: 'rgba(30, 38, 56, 0.4)',
                    border: `1px solid ${isEliteVault ? 'rgba(250, 204, 21, 0.3)' : '#334155'}`,
                    borderRadius: '9999px',
                    padding: '2px 8px',
                    letterSpacing: '1px',
                    verticalAlign: 'middle'
                  }}>V5.2</span>
                </Typography>

                {isEliteVault ? (
                  <div style={{ display: 'inline-block', marginTop: '4px', padding: '4px 12px', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '9999px', background: 'rgba(250, 204, 21, 0.05)', boxShadow: '0 0 12px rgba(250, 204, 21, 0.1)' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: '600', color: '#FACC15', letterSpacing: '0.15em' }}>ELITE TRIP VAULT : ACTIVE</span>
                  </div>
                ) : (
                  <p style={{ color: '#94A3B8', fontSize: 'clamp(0.45rem, 2.5vw, 0.7rem)', lineHeight: 1.3, width: '100%', whiteSpace: 'normal', overflowWrap: 'break-word', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px', marginBottom: 0 }}>ABHIRAJ'S TRANSACTION LEDGER</p>
                )}
              </Box>
            </Box>

            <Box
              className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 mb-6 w-full"
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                gap: '10px',
                p: '12px',
                borderRadius: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(30, 41, 59, 0.6)',
                mt: 3,
                mb: 3,
                width: '100%',
                position: 'relative',
                zIndex: 20
              }}
            >
              <Button
                fullWidth
                className="py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                sx={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(8px)',
                  py: 1,
                  px: 1.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#FACC15',
                  border: isEliteVault ? '1px solid rgba(250, 204, 21, 0.8)' : '1px solid rgba(250, 204, 21, 0.3)',
                  boxShadow: isEliteVault ? '0 0 12px rgba(250, 204, 21, 0.3)' : 'none',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    background: 'rgba(30, 41, 59, 0.8)',
                    boxShadow: '0 0 12px rgba(250, 204, 21, 0.5)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  '& .MuiButton-startIcon': { mr: 0.5, '& > *:nth-of-type(1)': { fontSize: '1rem' } }
                }}
                onClick={() => setIsEliteVault(!isEliteVault)}
                startIcon={<AutoAwesomeIcon sx={{ fontSize: '1rem' }} />}
              >
                {isEliteVault ? 'Exit Vault' : 'Elite Expenses'}
              </Button>
              <Button
                fullWidth
                className="py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                sx={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(8px)',
                  py: 1,
                  px: 1.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#06B6D4',
                  border: isIncognito ? '1px solid rgba(6, 182, 212, 0.8)' : '1px solid rgba(6, 182, 212, 0.3)',
                  boxShadow: isIncognito ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    background: 'rgba(30, 41, 59, 0.8)',
                    boxShadow: '0 0 12px rgba(6, 182, 212, 0.5)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  '& .MuiButton-startIcon': { mr: 0.5, '& > *:nth-of-type(1)': { fontSize: '1rem' } }
                }}
                startIcon={isIncognito ? <VisibilityOffIcon sx={{ fontSize: '1rem' }} /> : <VisibilityIcon sx={{ fontSize: '1rem' }} />}
                onClick={toggleIncognito}
              >
                {isIncognito ? 'Reveal' : 'Incognito'}
              </Button>
              <Button
                fullWidth
                className="py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                sx={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(8px)',
                  py: 1,
                  px: 1.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#94A3B8',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    background: 'rgba(30, 41, 59, 0.8)',
                    borderColor: 'rgba(148, 163, 184, 0.5)',
                    boxShadow: '0 0 12px rgba(148, 163, 184, 0.2)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  '& .MuiButton-startIcon': { mr: 0.5, '& > *:nth-of-type(1)': { fontSize: '1rem' } }
                }}
                startIcon={<LockIcon sx={{ fontSize: '1rem' }} />}
                onClick={() => {
                  sessionStorage.removeItem('vault_unlocked');
                  setIsAppUnlocked(false);
                }}
              >
                Lock Vault
              </Button>
              <Button
                fullWidth
                className="py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                sx={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(8px)',
                  py: 1,
                  px: 1.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    background: 'rgba(30, 41, 59, 0.8)',
                    boxShadow: '0 0 12px rgba(16, 185, 129, 0.5)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  '& .MuiButton-startIcon': { mr: 0.5, '& > *:nth-of-type(1)': { fontSize: '1rem' } }
                }}
                startIcon={<PaymentsIcon sx={{ fontSize: '1rem' }} />}
                onClick={() => setAtmModalOpen(true)}
              >
                Convert to Cash
              </Button>
              <Button
                fullWidth
                className="py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                sx={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(8px)',
                  py: 1,
                  px: 1.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    background: 'rgba(30, 41, 59, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 0 12px rgba(255, 255, 255, 0.2)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  '& .MuiButton-startIcon': { mr: 0.5, '& > *:nth-of-type(1)': { fontSize: '1rem' } }
                }}
                startIcon={<PictureAsPdfIcon sx={{ fontSize: '1rem' }} />}
                onClick={handleExport}
              >
                Export PDF
              </Button>
              <Button
                fullWidth
                className="py-2 px-3 text-xs font-medium rounded-lg flex items-center justify-center gap-2 transition-all duration-150 active:scale-95"
                sx={{
                  background: 'rgba(30, 41, 59, 0.4)',
                  backdropFilter: 'blur(8px)',
                  py: 1,
                  px: 1.5,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  borderRadius: '8px',
                  color: '#F43F5E',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  transition: 'all 150ms ease',
                  '&:hover': {
                    background: 'rgba(30, 41, 59, 0.8)',
                    borderColor: 'rgba(244, 63, 94, 0.5)',
                    boxShadow: '0 0 12px rgba(244, 63, 94, 0.3)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  '& .MuiButton-startIcon': { mr: 0.5, '& > *:nth-of-type(1)': { fontSize: '1rem' } }
                }}
                startIcon={<DeleteForeverIcon sx={{ fontSize: '1rem' }} />}
                onClick={() => setResetStage(1)}
              >
                Reset Ledger
              </Button>
            </Box>
          </Box>

          {/* Top Metrics Section (4-Card Grid) */}
          <Box
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full mb-6"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
              gap: { xs: 1.5, sm: 2 },
              width: '100%',
              mb: 3
            }}
          >
            {/* Card 1: Net Balance */}
            <div
              className="p-3 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/30 transition-colors w-full flex flex-col justify-between"
              style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid #1e293b',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="truncate" style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  Net Balance
                </span>
                <AccountBalanceWalletIcon sx={{ color: '#94A3B8', fontSize: { xs: 16, sm: 18 }, flexShrink: 0, ml: 0.5 }} />
              </div>
              <div
                className={`text-base sm:text-lg font-bold font-mono tracking-tight truncate ${isIncognito ? 'incognito-blur' : ''}`}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                  color: '#F8FAFC'
                }}
              >
                <Odometer amount={totalNetBalancePaisa} />
              </div>
            </div>

            {/* Card 2: Inflows */}
            <div
              className="p-3 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-colors w-full flex flex-col justify-between"
              style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid #1e293b',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="truncate" style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  Inflows
                </span>
                <TrendingUpIcon sx={{ color: '#10B981', fontSize: { xs: 16, sm: 18 }, flexShrink: 0, ml: 0.5 }} />
              </div>
              <div
                className={`text-base sm:text-lg font-bold font-mono tracking-tight truncate ${isIncognito ? 'incognito-blur' : ''}`}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                  color: isEliteVault ? '#3B82F6' : '#10B981'
                }}
              >
                <Odometer amount={totalInflowPaisa} />
              </div>
            </div>

            {/* Card 3: Expenses */}
            <div
              className="p-3 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-rose-500/30 transition-colors w-full flex flex-col justify-between"
              style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid #1e293b',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="truncate" style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  Expenses
                </span>
                <TrendingDownIcon sx={{ color: '#F43F5E', fontSize: { xs: 16, sm: 18 }, flexShrink: 0, ml: 0.5 }} />
              </div>
              <div
                className={`text-base sm:text-lg font-bold font-mono tracking-tight truncate ${isIncognito ? 'incognito-blur' : ''}`}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                  color: '#F43F5E'
                }}
              >
                <Odometer amount={totalExpensesPaisa} />
              </div>
            </div>

            {/* Card 4: Cash in Hand */}
            <div
              className="p-3 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 transition-colors w-full flex flex-col justify-between"
              style={{
                padding: '12px',
                borderRadius: '12px',
                backgroundColor: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid #1e293b',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                width: '100%'
              }}
            >
              <div className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span className="truncate" style={{ fontSize: 'clamp(11px, 2.5vw, 12px)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  Cash in Hand
                </span>
                <PaymentsIcon sx={{ color: '#94A3B8', fontSize: { xs: 16, sm: 18 }, flexShrink: 0, ml: 0.5 }} />
              </div>
              <div
                className={`text-base sm:text-lg font-bold font-mono tracking-tight truncate ${isIncognito ? 'incognito-blur' : ''}`}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.025em',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.2,
                  color: '#F8FAFC'
                }}
              >
                <Odometer amount={cashOnHandPaisa} />
              </div>
            </div>
          </Box>

          {/* Tableau-Grade Visual Analytics */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 3 }}>
            <MetallicCard sx={{
              p: 4,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              background: '#141923',
              border: '1px solid #1E2638',
              borderRadius: '16px',
            }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Expenses Breakdown
              </Typography>
              {chartData.length > 0 ? (
                <div
                  className="relative w-full h-64 flex items-center justify-center"
                  style={{ position: 'relative', width: '100%', height: '16rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius="70%"
                        outerRadius="90%"
                        dataKey="value"
                        stroke="transparent"
                        onClick={(entry: any) => {
                          if (entry && entry.name) {
                            setActiveCategory({ name: entry.name, value: Number(entry.value) });
                          }
                        }}
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                            stroke="transparent"
                            onClick={() => setActiveCategory(entry)}
                            style={{ cursor: 'pointer', outline: 'none' }}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* The Dynamic Hollow Center (Apple Card Style) */}
                  <div
                    className="absolute inset-0 m-auto flex flex-col items-center justify-center text-center select-none"
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      maxWidth: '120px',
                      pointerEvents: activeCategory ? 'auto' : 'none',
                      cursor: activeCategory ? 'pointer' : 'default'
                    }}
                    onClick={() => {
                      if (activeCategory) setActiveCategory(null);
                    }}
                  >
                    <span
                      className="text-xs font-medium text-slate-400 max-w-[120px] truncate block tracking-wider uppercase"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: '#94a3b8',
                        maxWidth: '120px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                      title={activeCategory ? activeCategory.name : 'Total'}
                    >
                      {activeCategory ? activeCategory.name : 'Total'}
                    </span>
                    <span
                      className="text-xl sm:text-2xl font-bold text-white tracking-tight"
                      style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '-0.025em',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ₹{(activeCategory ? activeCategory.value : totalExpenseAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem', background: 'radial-gradient(circle at center, rgba(30, 38, 56, 0.5) 0%, transparent 70%)', borderRadius: '8px' }}>
                  <Typography variant="subtitle1" color="text.secondary">No expenses recorded yet.</Typography>
                </Box>
              )}
            </MetallicCard>
          </Box>

          {/* Central Transaction Console & Live Feed */}
          <Box
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full mt-6"
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
              gap: 3,
              width: '100%',
              mt: 3
            }}
          >
            <Box
              className="lg:col-span-1 w-full"
              sx={{
                gridColumn: { xs: 'span 1', lg: 'span 1' },
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <FinancialEngine
                onRecordTransaction={handleRecordTransaction}
                isEliteVault={isEliteVault}
                tripMembers={tripMembers}
                setTripMembers={setTripMembers}
              />
            </Box>

            <Box
              className="lg:col-span-2 w-full min-w-0 overflow-hidden"
              sx={{
                gridColumn: { xs: 'span 1', lg: 'span 2' },
                width: '100%',
                minWidth: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Recent Transactions
              </Typography>
              <Box sx={{
                backgroundColor: '#141923',
                border: '1px solid #1E2638',
                borderRadius: '16px',
                maxHeight: '400px',
                overflowY: 'auto',
                p: { xs: 1.5, sm: 2 },
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#1E2638', borderRadius: '4px' }
              }}>
                {transactions.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(tx => {
                  const isHighlighted = tx.description?.includes('[HIGHLIGHT]');
                  const displayDescription = tx.description?.replace('[HIGHLIGHT]', '').replace('[ELITE]', '').trim();

                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between w-full p-3 mb-2 bg-slate-900/60 rounded-xl border border-slate-800"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '12px',
                        marginBottom: '8px',
                        borderRadius: '12px',
                        backgroundColor: isHighlighted ? 'rgba(250, 204, 21, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                        border: isHighlighted ? '1px solid rgba(250, 204, 21, 0.4)' : '1px solid #1E2638',
                        borderLeft: isHighlighted ? '3px solid #FACC15' : undefined
                      }}
                    >
                      {/* Left side */}
                      <div className="flex-1 min-w-0 pr-3 truncate" style={{ flex: 1, minWidth: 0, paddingRight: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <Typography
                          className="truncate"
                          sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: '#F8FAFC',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {tx.category} {displayDescription ? `- ${displayDescription}` : ''}
                        </Typography>
                        <Typography
                          className="truncate"
                          sx={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: '#64748B',
                            fontSize: '0.75rem',
                            mt: '2px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {new Date(tx.created_at).toLocaleDateString()} • {tx.payment_method}
                        </Typography>
                      </div>

                      {/* Right side */}
                      <div className="shrink-0 flex items-center gap-2" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Typography sx={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          whiteSpace: 'nowrap',
                          color: tx.transaction_direction === 'inflow' 
                            ? (isEliteVault && !tx.description?.includes('ATM Withdrawal') ? '#3B82F6' : '#10B981') 
                            : '#F43F5E'
                        }}>
                          {tx.transaction_direction === 'inflow' ? '+' : '-'}₹{(tx.amount_paisa / 100).toLocaleString('en-IN')}
                        </Typography>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 transition-colors"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            padding: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease',
                            borderRadius: '6px'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.color = '#F43F5E';
                            e.currentTarget.style.transform = 'scale(1.1)';
                            e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.color = '#64748b';
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ color: '#64748B' }}>No recent transactions.</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Reset Ledger Modals */}
      <Dialog
        open={resetStage === 1}
        onClose={() => setResetStage(0)}
        sx={{ '& .MuiDialog-paper': { background: '#141923', border: '1px solid #1E2638' } }}
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
        sx={{ '& .MuiDialog-paper': { background: '#141923', border: '1px solid #1E2638' } }}
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

      {/* ATM Withdrawal Modal */}
      <Dialog
        open={atmModalOpen}
        onClose={() => setAtmModalOpen(false)}
        sx={{
          '& .MuiDialog-paper': {
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            willChange: 'transform, opacity',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            width: '100%',
            maxWidth: '400px'
          }
        }}
      >
        <DialogTitle sx={{ color: '#10B981', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'center', pt: 4 }}>
          ATM WITHDRAWAL
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textAlign: 'center', mb: 3 }}>
            Convert online funds to offline cash. This will execute a balancing transaction pair to keep your Net Balance intact while increasing Cash on Hand.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Amount (₹)</Typography>
            <Box
              component="input"
              type="number"
              value={atmAmount}
              onChange={(e: any) => setAtmAmount(e.target.value)}
              placeholder="0.00"
              sx={{
                width: '100%',
                background: 'rgba(11, 14, 20, 0.6)',
                border: '1px solid #1E2638',
                borderRadius: '12px',
                padding: '16px',
                color: '#F8FAFC',
                fontSize: '1.5rem',
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 700,
                outline: 'none',
                boxSizing: 'border-box',
                '&:focus': {
                  borderColor: '#10B981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1, display: 'flex', gap: 2 }}>
          <Button
            onClick={() => setAtmModalOpen(false)}
            sx={{ flex: 1, color: '#94A3B8', border: '1px solid #1E2638', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}
          >
            CANCEL
          </Button>
          <Button
            onClick={handleAtmWithdrawal}
            disabled={!atmAmount || parseFloat(atmAmount) <= 0}
            variant="contained"
            sx={{
              flex: 1,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#fff',
              fontWeight: 800,
              '&:hover': { background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' },
              '&.Mui-disabled': { background: '#1E2638', color: '#64748B' }
            }}
          >
            WITHDRAW
          </Button>
        </DialogActions>
      </Dialog>

      {vfxMode === 'deposit' && (
        <Box sx={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'opacity, filter',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          background: 'radial-gradient(circle at center, transparent 40%, rgba(16, 185, 129, 0.05) 80%, rgba(16, 185, 129, 0.15) 100%)',
          boxShadow: 'inset 0 0 120px 20px rgba(16, 185, 129, 0.5), inset 0 0 40px 5px rgba(16, 185, 129, 0.8)',
          animation: 'pulse3D 3.5s ease-out forwards',
        }}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', width: '100px', height: '100px', marginTop: '-50px', marginLeft: '-50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: 'white', transformStyle: 'preserve-3d', willChange: 'transform, opacity',
            background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.6), inset 0 0 15px rgba(255,255,255,0.4)', border: '2px solid #34D399',
            animation: 'popAndFlip 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            ₹
          </Box>
        </Box>
      )}

      {vfxMode === 'withdraw' && (
        <Box sx={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'opacity, filter',
          transform: 'translateZ(0)',
          WebkitBackfaceVisibility: 'hidden',
          background: 'radial-gradient(circle at center, transparent 40%, rgba(244, 63, 94, 0.05) 80%, rgba(244, 63, 94, 0.15) 100%)',
          boxShadow: 'inset 0 0 120px 20px rgba(244, 63, 94, 0.6), inset 0 0 40px 5px rgba(244, 63, 94, 0.9)',
          animation: 'flash3D 3.5s ease-out forwards',
        }}>
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', width: '100px', height: '100px', marginTop: '-50px', marginLeft: '-50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: 'white', transformStyle: 'preserve-3d', willChange: 'transform, opacity',
            background: 'linear-gradient(135deg, #F43F5E, #E11D48)', boxShadow: '0 10px 30px rgba(244, 63, 94, 0.6), inset 0 0 15px rgba(255,255,255,0.4)', border: '2px solid #FB7185',
            animation: 'popAndFlip 2.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            ₹
          </Box>
        </Box>
      )}

      {/* In-App PDF Preview Modal */}
      <Dialog
        open={!!pdfPreviewUrl}
        onClose={() => { setPdfPreviewUrl(null); setPdfSaveFn(null); }}
        maxWidth="md"
        fullWidth
        sx={{
          zIndex: 1000,
          '& .MuiDialog-paper': {
            background: 'rgba(20, 25, 35, 0.95)',
            backdropFilter: 'blur(8px)',
            willChange: 'transform, opacity',
            border: '1px solid #1E2638',
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ color: '#F8FAFC', fontWeight: 700, borderBottom: '1px solid #1E2638' }}>
          Ledger Report Preview
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: '500px' }}>
          {pdfPreviewUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ flex: 1, width: '100%', overflowY: 'auto', backgroundColor: '#0B0E14', display: 'flex', justifyContent: 'center', borderRadius: '8px', padding: '8px' }}>
                <Document
                  file={pdfPreviewUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={<p style={{ color: '#10B981', fontFamily: "'JetBrains Mono', monospace" }}>Rendering Ledger...</p>}
                  error={<p style={{ color: '#F43F5E', fontFamily: "'JetBrains Mono', monospace" }}>Failed to load PDF preview.</p>}
                >
                  <Page
                    pageNumber={pageNumber}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    width={window.innerWidth < 600 ? window.innerWidth - 80 : 450}
                  />
                </Document>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '12px 16px', color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.85rem', backgroundColor: '#0B0E14', borderTop: '1px solid #1E2638' }}>
                <button
                  onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                  disabled={pageNumber === 1}
                  style={{ background: '#1E2638', border: '1px solid #334155', color: '#F8FAFC', borderRadius: '6px', padding: '6px 12px', cursor: pageNumber === 1 ? 'default' : 'pointer', transition: 'all 0.2s', opacity: pageNumber === 1 ? 0.5 : 1, pointerEvents: pageNumber === 1 ? 'none' : 'auto' }}
                >
                  Previous
                </button>
                <span>Page {pageNumber} of {numPages || '--'}</span>
                <button
                  onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
                  disabled={pageNumber === numPages}
                  style={{ background: '#1E2638', border: '1px solid #334155', color: '#F8FAFC', borderRadius: '6px', padding: '6px 12px', cursor: pageNumber === numPages ? 'default' : 'pointer', transition: 'all 0.2s', opacity: pageNumber === numPages ? 0.5 : 1, pointerEvents: pageNumber === numPages ? 'none' : 'auto' }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #1E2638', display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            onClick={() => { setPdfPreviewUrl(null); setPdfSaveFn(null); }}
            variant="outlined"
            color="secondary"
            sx={{ flex: 1, py: 1.5, fontSize: '1.1rem', borderColor: 'rgba(248, 250, 252, 0.2)', color: '#F8FAFC', '&:hover': { borderColor: '#F8FAFC', background: 'rgba(248,250,252,0.05)' } }}
          >
            Close Preview
          </Button>
          <Button
            onClick={() => {
              if (pdfSaveFn) pdfSaveFn();
              setPdfPreviewUrl(null);
              setPdfSaveFn(null);
            }}
            variant="contained"
            color="primary"
            sx={{ flex: 1, py: 1.5, fontSize: '1.1rem', background: '#10B981', color: '#fff', boxShadow: '0 4px 20px rgba(16,185,129,0.4)', '&:hover': { background: '#059669', boxShadow: '0 6px 24px rgba(16,185,129,0.5)' } }}
          >
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>

    </ThemeProvider>
  );
}
