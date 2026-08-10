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

export default function App() {
  const currentRoomId = 'default_room';
  const [isIncognito, setIsIncognito] = useState(() => {
    return localStorage.getItem('rupeeMelt_incognito') === 'true';
  });

  const toggleIncognito = async () => {
    const nextState = !isIncognito;
    setIsIncognito(nextState);

    // Save locally for instant zero-latency boot
    localStorage.setItem('rupeeMelt_incognito', String(nextState));

    // Silently sync to Supabase settings if a active ledger/room is loaded
    try {
      if (currentRoomId) {
        await supabase
          .from('ledger_settings')
          .upsert({ room_id: currentRoomId, is_incognito: nextState });
      }
    } catch (err) {
      console.log('Local persistence fallback active');
    }
  };

  // Data Purity: Initialized to strictly 0
  const [cashOnHandPaisa, setCashOnHandPaisa] = useState(0);
  const [totalExpensesPaisa, setTotalExpensesPaisa] = useState(0);
  const [totalInflowPaisa, setTotalInflowPaisa] = useState(0);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const totalNetBalancePaisa = totalInflowPaisa - totalExpensesPaisa;

  // Reset Ledger Protocol States
  const [resetStage, setResetStage] = useState<0 | 1 | 2>(0);
  const [vfxMode, setVfxMode] = useState<null | 'deposit' | 'withdraw'>(null);

  // PDF Preview State
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfSaveFn, setPdfSaveFn] = useState<(() => void) | null>(null);

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

    // Initial Boot Sync (Cross-Device)
    const syncIncognitoState = async () => {
      try {
        const { data, error } = await supabase
          .from('ledger_settings')
          .select('is_incognito')
          .eq('room_id', currentRoomId)
          .maybeSingle();

        if (data && !error && data.is_incognito !== null) {
          setIsIncognito(data.is_incognito);
          localStorage.setItem('rupeeMelt_incognito', String(data.is_incognito));
        }
      } catch (err) {
        console.log('Sync failed, using local preference');
      }
    };
    syncIncognitoState();
  }, []);

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
    const { blobUrl, save } = generateLedgerReport('My_Personal_Ledger', transactions);
    setPdfPreviewUrl(blobUrl);
    setPdfSaveFn(() => save);
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
                fontFamily: "'Plus Jakarta Sans', sans-serif",
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
              <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                RupeeMelt
              </Typography>
              <Typography variant="subtitle1" sx={{ color: '#94A3B8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Abhiraj's Transaction Ledger
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Typography sx={{
              position: 'absolute',
              top: 16,
              right: 24,
              fontWeight: 800,
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              background: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent',
              zIndex: 100
            }}>
              Only for personal use of Abhiraj Dixit
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
              sx={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 'clamp(1.1rem, 4vw, 1.8rem)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.1, color: '#10B981' }}
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

        {/* Central Transaction Console */}
        <Box className="dashboard-grid">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3cqi, 3rem)' }}>
            <FinancialEngine onRecordTransaction={handleRecordTransaction} />
          </Box>
        </Box>
      </Container>

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
        }} />
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
        }} />
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
            <div style={{ width: '100%', height: '60vh', overflowY: 'auto', backgroundColor: '#0B0E14', display: 'flex', justifyContent: 'center', borderRadius: '8px', padding: '8px' }}>
              <Document
                file={pdfPreviewUrl}
                loading={<p style={{ color: '#10B981', fontFamily: "'JetBrains Mono', monospace" }}>Rendering Ledger...</p>}
                error={<p style={{ color: '#F43F5E', fontFamily: "'JetBrains Mono', monospace" }}>Failed to load PDF preview.</p>}
              >
                <Page
                  pageNumber={1}
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  width={window.innerWidth < 600 ? window.innerWidth - 80 : 450}
                />
              </Document>
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
