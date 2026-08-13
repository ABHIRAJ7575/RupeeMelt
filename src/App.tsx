import { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, ThemeProvider, createTheme, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PaymentsIcon from '@mui/icons-material/Payments';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { MetallicCard } from './components/ui/MetallicCard';
import Odometer from './components/ui/Odometer';
import { ParticleEngine } from './components/ui/ParticleEngine';
import { FinancialEngine } from './components/ledger/FinancialEngine';
import { generateLedgerReport } from './lib/pdfGenerator';
import { supabase } from './lib/supabase';
import type { LedgerTransaction } from './lib/supabase';
import { Document, Page, pdfjs } from 'react-pdf';

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
  const [isEliteVault, setIsEliteVault] = useState(false);
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

  const fetchTransactions = async (activeRoomId: string) => {
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
    const activeRoom = isEliteVault ? 'Elite_Trip_Vault' : 'My_Personal_Ledger';
    fetchTransactions(activeRoom);
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

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));
  const PIE_COLORS = ['#06b6d4', '#8b5cf6', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6'];

  const handleRecordTransaction = async (amountPaisa: number, type: 'inflow' | 'outflow', paymentMethod: 'online' | 'offline', category: string, desc: string) => {
    try {
      let finalDesc = desc;
      if (isEliteVault) {
        finalDesc = finalDesc ? `${finalDesc} [ELITE]` : '[ELITE]';
      }

      const { error } = await supabase.from('user_ledger').insert({
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

    await fetchTransactions(currentRoomId);

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
        fetchTransactions(currentRoomId);
      }
    } catch (error) {
      console.error('Error wiping ledger:', error);
    }
    setResetStage(0);
  };

  console.log("🔥 RENDER CYCLE -> Vault:", isEliteVault ? "ELITE TRIP" : "PERSONAL", "| Active Room ID:", isEliteVault ? 'Elite_Trip_Vault' : 'My_Personal_Ledger');

  return (
    <ThemeProvider theme={isEliteVault ? eliteTheme : darkTheme}>
      <Box sx={{ background: isEliteVault ? '#0A0F1C' : '#0B0E14', minHeight: '100vh', transition: 'background 0.5s ease', position: 'relative' }}>
        <ParticleEngine />

        <Container maxWidth={false} sx={{ maxWidth: 'var(--app-max-width)', py: 'clamp(2rem, 4cqi, 4rem)', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 4cqi, 4rem)', position: 'relative', zIndex: 10 }}>
          {/* Header Pipeline */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textAlign: 'center' }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            {/* LEFT: Massive Logo */}
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
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
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
              <Typography sx={{
                fontWeight: 800,
                fontSize: '0.7rem',
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

              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF', display: 'flex', alignItems: 'center' }}>
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
                  marginLeft: '8px', 
                  letterSpacing: '1px', 
                  verticalAlign: 'middle' 
                }}>V5.0</span>
              </Typography>
              
              {isEliteVault ? (
                <div style={{ display: 'inline-block', marginTop: '4px', padding: '4px 12px', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '9999px', background: 'rgba(250, 204, 21, 0.05)', boxShadow: '0 0 12px rgba(250, 204, 21, 0.1)' }}>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.65rem', fontWeight: '600', color: '#FACC15', letterSpacing: '0.15em' }}>ELITE TRIP VAULT : ACTIVE</span>
                </div>
              ) : (
                <p style={{ color: '#94A3B8', fontSize: '0.75rem', letterSpacing: '1px', textTransform: 'uppercase', marginTop: '4px', marginBottom: 0 }}>ABHIRAJ'S TRANSACTION LEDGER</p>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', mt: 3, mb: 1 }}>
            <Button
              variant={isEliteVault ? "contained" : "outlined"}
              sx={{
                color: isEliteVault ? '#0B0E14' : '#F59E0B',
                background: isEliteVault ? '#F59E0B' : 'transparent',
                borderColor: '#F59E0B',
                fontWeight: 800,
                '&:hover': { background: isEliteVault ? '#D97706' : 'rgba(245, 158, 11, 0.1)' }
              }}
              onClick={() => setIsEliteVault(!isEliteVault)}
              startIcon={<AutoAwesomeIcon />}
            >
              {isEliteVault ? 'Exit Vault' : 'Elite Expenses'}
            </Button>
            <Button
              variant="contained"
              color="secondary"
              startIcon={isIncognito ? <VisibilityOffIcon /> : <VisibilityIcon />}
              onClick={toggleIncognito}
            >
              {isIncognito ? 'Reveal' : 'Incognito'}
            </Button>
            <Button variant="outlined" color="primary" startIcon={<PictureAsPdfIcon />} onClick={handleExport}>
              Export PDF
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteForeverIcon />} onClick={() => setResetStage(1)}>
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
            background: '#141923',
            border: '1px solid #1E2638',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.5)',
              transform: 'translateY(-4px)'
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Total Net Balance
              </Typography>
              <AccountBalanceWalletIcon sx={{ color: '#94A3B8' }} />
            </Box>
            <Typography
              variant="h2"
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'clamp(1.1rem, 4vw, 1.8rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1, color: '#F8FAFC' }}
            >
              <Odometer amount={totalNetBalancePaisa} />
            </Typography>
          </MetallicCard>

          <MetallicCard sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            height: '100%',
            background: '#141923',
            border: '1px solid #1E2638',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(16, 185, 129, 0.5)',
              boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.15)',
              transform: 'translateY(-4px)'
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Total Inflows
              </Typography>
              <TrendingUpIcon sx={{ color: '#10B981' }} />
            </Box>
            <Typography
              variant="h2"
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'clamp(1.1rem, 4vw, 1.8rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1, color: isEliteVault ? '#3B82F6' : '#10B981' }}
            >
              <Odometer amount={totalInflowPaisa} />
            </Typography>
          </MetallicCard>

          <MetallicCard sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            height: '100%',
            background: '#141923',
            border: '1px solid #1E2638',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(244, 63, 94, 0.5)',
              boxShadow: '0 10px 20px -5px rgba(244, 63, 94, 0.15)',
              transform: 'translateY(-4px)'
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Total Expenses
              </Typography>
              <TrendingDownIcon sx={{ color: '#F43F5E' }} />
            </Box>
            <Typography
              variant="h2"
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'clamp(1.1rem, 4vw, 1.8rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1, color: '#F43F5E' }}
            >
              <Odometer amount={totalExpensesPaisa} />
            </Typography>
          </MetallicCard>

          <MetallicCard sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            height: '100%',
            background: '#141923',
            border: '1px solid #1E2638',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            '&:hover': {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.5)',
              transform: 'translateY(-4px)'
            }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Cash on Hand (Offline)
              </Typography>
              <PaymentsIcon sx={{ color: '#94A3B8' }} />
            </Box>
            <Typography
              variant="h2"
              className={isIncognito ? 'incognito-blur' : ''}
              sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'clamp(1.1rem, 4vw, 1.8rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1, color: '#F8FAFC' }}
            >
              <Odometer amount={cashOnHandPaisa} />
            </Typography>
          </MetallicCard>
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
              <Box sx={{
                flex: 1,
                position: 'relative',
                background: 'radial-gradient(circle at center, rgba(30, 38, 56, 0.5) 0%, transparent 70%)',
                borderRadius: '8px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#141923', border: '1px solid #1E2638', borderRadius: '8px' }}
                      itemStyle={{ color: '#F8FAFC', fontWeight: 600 }}
                      formatter={(value: any) => ['₹' + Number(value).toLocaleString('en-IN'), 'Amount']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: 'radial-gradient(circle at center, rgba(30, 38, 56, 0.5) 0%, transparent 70%)', borderRadius: '8px' }}>
                <Typography variant="subtitle1" color="text.secondary">No expenses recorded yet.</Typography>
              </Box>
            )}
          </MetallicCard>
        </Box>

        {/* Central Transaction Console & Live Feed */}
        <Box className="dashboard-grid">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3cqi, 3rem)' }}>
            <FinancialEngine 
              onRecordTransaction={handleRecordTransaction} 
              isEliteVault={isEliteVault}
              tripMembers={tripMembers}
              setTripMembers={setTripMembers}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Recent Transactions
            </Typography>
            <Box sx={{ 
              backgroundColor: '#141923', 
              border: '1px solid #1E2638', 
              borderRadius: '16px', 
              maxHeight: '400px', 
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': { background: '#1E2638', borderRadius: '4px' }
            }}>
              {transactions.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(tx => {
                const isHighlighted = tx.description?.includes('[HIGHLIGHT]');
                const displayDescription = tx.description?.replace('[HIGHLIGHT]', '').replace('[ELITE]', '').trim();
                
                return (
                <Box key={tx.id} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  borderBottom: '1px solid rgba(30, 38, 56, 0.5)',
                  background: isHighlighted ? 'linear-gradient(90deg, rgba(250, 204, 21, 0.15) 0%, transparent 100%)' : 'transparent',
                  borderLeft: isHighlighted ? '3px solid #FACC15' : 'none',
                  '&:last-child': { borderBottom: 'none' }
                }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#F8FAFC', fontWeight: 600 }}>
                      {tx.category} {displayDescription ? `- ${displayDescription}` : ''}
                    </Typography>
                    <Typography sx={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#64748B', fontSize: '0.75rem' }}>
                      {new Date(tx.created_at).toLocaleDateString()} • {tx.payment_method}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ 
                      fontFamily: "'JetBrains Mono', monospace", 
                      fontWeight: 700, 
                      color: tx.transaction_direction === 'inflow' ? (isEliteVault ? '#3B82F6' : '#10B981') : '#F43F5E' 
                    }}>
                      {tx.transaction_direction === 'inflow' ? '+' : '-'}₹{(tx.amount_paisa / 100).toLocaleString('en-IN')}
                    </Typography>
                    <button 
                      onClick={() => handleDeleteTransaction(tx.id)}
                      style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        color: '#475569', 
                        padding: '8px', 
                        cursor: 'pointer', 
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#F43F5E';
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
                        e.currentTarget.style.borderRadius = '8px';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#475569';
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </Box>
                </Box>
              )})}
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
            backdropFilter: 'blur(16px)',
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
