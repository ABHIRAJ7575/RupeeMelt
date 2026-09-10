import React, { useState } from 'react';
import { Box, Typography, Button, TextField, ToggleButton, ToggleButtonGroup, IconButton, FormControlLabel, Switch, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SouthIcon from '@mui/icons-material/South';
import NorthIcon from '@mui/icons-material/North';
import { MetallicCard } from '../ui/MetallicCard';
import { CategoryManagerModal } from './CategoryManagerModal';

interface FinancialEngineProps {
  onRecordTransaction: (amountPaisa: number, type: 'inflow' | 'outflow', paymentMethod: 'online' | 'offline', category: string, desc: string) => Promise<void>;
  isEliteVault?: boolean;
  tripMembers?: string[];
  setTripMembers?: React.Dispatch<React.SetStateAction<string[]>>;
}

const DEFAULT_DEBIT_CATEGORIES: Record<string, string[]> = {
  'Meteor 350': ['Petrol', 'Speed-Petrol', 'Service', 'Maintenance', 'Wash'],
  'Pulsar 150': ['Petrol', 'Speed-Petrol', 'Service', 'Repair'],
  'Eco-Sport': ['Fuel', 'Service', 'Insurance', 'Toll', 'Wash'],
  'Activa H-Smart': ['Petrol', 'Speed-Petrol', 'Service', 'Repair'],
  'Family Food/Outing Expenses': ['Groceries', 'Dine Out', 'Delivery'],
  'Outing': ['Cafe', 'Movies', 'Travel'],
  'Outing Personal': ['Cafe', 'Movies', 'Travel'],
  'Cell Phone Recharge': ['Personal', 'Family'],
  'SIP': ['Mutual Funds', 'Equity'],
  'Fast-Food': ['Street Food', 'Snacks'],
  'Fast-Food Personal': ['Street Food', 'Snacks'],
  'Home Expenses': ['Groceries', 'Bills', 'Repairs'],
  'Personal Shopping': ['Clothing', 'Electronics', 'Footwear'],
  'Shopping Personal': ['Clothing', 'Electronics', 'Footwear'],
  'Family Shopping': ['Clothing', 'Home Goods', 'Gifts'],
  'Paying Loan': ['EMI', 'Principal'],
  'Others': ['General', 'Miscellaneous']
};

const DEFAULT_CREDIT_CATEGORIES: Record<string, string[]> = {
  'Salary': ['Monthly', 'Bonus'],
  'Cashback': ['Credit Card', 'UPI Cashback', 'Offer'],
  'Freelance': ['Project', 'Consulting'],
  'Cash Deposit': ['ATM', 'Direct'],
  'Investment Returns': ['Dividends', 'Interest'],
  'Others': ['Refund', 'Gift']
};

export const FinancialEngine: React.FC<FinancialEngineProps> = ({ onRecordTransaction, isEliteVault = false, tripMembers = [], setTripMembers }) => {
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'inflow' | 'outflow'>('outflow');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [category, setCategory] = useState('Others');
  const [subCategory, setSubCategory] = useState('');

  const [isHighlight, setIsHighlight] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // State initialization with localStorage fallback
  const [categoriesMap, setCategoriesMap] = useState(() => {
    const saved = localStorage.getItem('rupee_custom_categories_v1');
    return saved ? JSON.parse(saved) : { debit: DEFAULT_DEBIT_CATEGORIES, credit: DEFAULT_CREDIT_CATEGORIES };
  });

  const saveCategories = (updated: { debit: Record<string, string[]>; credit: Record<string, string[]> }) => {
    setCategoriesMap(updated);
    localStorage.setItem('rupee_custom_categories_v1', JSON.stringify(updated));
  };

  const activeCategoriesDict = transactionType === 'outflow' ? categoriesMap.debit : categoriesMap.credit;

  const currentCategories = isEliteVault
    ? (transactionType === 'inflow' ? ['Trip Fund Collection', 'Refund', 'Others'] : ['Flight/Train', 'Hotel/Stay', 'Food & Drinks', 'Cab/Transport', 'Activities', 'Others'])
    : Object.keys(activeCategoriesDict);

  const availableSubCategories: string[] = isEliteVault
    ? ['General']
    : (activeCategoriesDict[category] || ['General']);

  React.useEffect(() => {
    setSubCategory('');
  }, [category]);

  // Trip Splitter State
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedSplitters, setSelectedSplitters] = useState<string[]>([]);

  React.useEffect(() => {
    if (transactionType === 'outflow') {
      setCategory(isEliteVault ? 'Food & Drinks' : 'Pulsar 150');
    } else {
      setCategory(isEliteVault ? 'Trip Fund Collection' : 'Salary');
    }
  }, [isEliteVault]);

  const handleModeSelect = (mode: 'inflow' | 'outflow') => {
    setTransactionType(mode);
    if (mode === 'inflow') {
      setCategory(isEliteVault ? 'Trip Fund Collection' : 'Salary');
    } else {
      setCategory(isEliteVault ? 'Food & Drinks' : 'Pulsar 150');
    }
    setFormStep(2);
  };

  const resetForm = () => {
    setFormStep(1);
    setAmountStr('');
    setDescription('');
    setCategory('Others');
    setSubCategory('');
    setIsHighlight(false);
    setSelectedSplitters([]);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      const paisa = Math.round(amount * 100);
      const chosenSub = subCategory || 'General';
      let finalDescription = isHighlight ? description + (description ? ' ' : '') + '[HIGHLIGHT]' : description;

      if (chosenSub && chosenSub !== 'General') {
        finalDescription = `[SUB:${chosenSub}] ` + finalDescription;
      }

      if (isEliteVault && selectedSplitters.length > 0) {
        const splitMath = Math.round(amount / selectedSplitters.length);
        const splitStr = `[Split: ${selectedSplitters.join(', ')}] (₹${splitMath} each)`;
        finalDescription = finalDescription ? `${finalDescription} | ${splitStr}` : splitStr;
      }

      await onRecordTransaction(paisa, transactionType, paymentMethod, category, finalDescription);
      resetForm();
    }
  };

  return (
    <MetallicCard sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3, willChange: 'transform, opacity' }}>
      <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700, mb: 1, display: formStep === 1 ? 'block' : 'none' }}>
        Ledger Engine
      </Typography>

      <div
        className="w-full grid grid-cols-2 gap-3 relative"
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          position: 'relative'
        }}
      >
        {formStep === 1 && (
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 25, 35, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '4px 12px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94A3B8',
            fontWeight: 800,
            fontSize: '0.75rem',
            zIndex: 2,
            display: { xs: 'none', sm: 'block' }
          }}>
            OR
          </Box>
        )}

        <Button
          onClick={() => handleModeSelect('inflow')}
          sx={{
            py: { xs: 2.5, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            fontSize: '1.1rem',
            borderRadius: 4,
            textTransform: 'none',
            fontWeight: 700,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: formStep === 2 && transactionType === 'inflow'
              ? 'linear-gradient(180deg, rgba(16,185,129,0.15) 0%, rgba(20,25,35,0) 100%)'
              : '#0f172a',
            color: '#10B981',
            border: formStep === 2 && transactionType === 'inflow'
              ? '1px solid #10B981'
              : '1px solid rgba(16, 185, 129, 0.3)',
            boxShadow: formStep === 2 && transactionType === 'inflow'
              ? '0 0 20px rgba(16, 185, 129, 0.2), inset 0 0 10px rgba(16, 185, 129, 0.1)'
              : 'inset 0 2px 4px rgba(255,255,255,0.05), 0 4px 6px rgba(0,0,0,0.3)',
            transform: formStep === 2 && transactionType === 'inflow' ? 'translateY(-2px)' : 'none',
            '&:hover': {
              background: 'linear-gradient(180deg, rgba(16,185,129,0.15) 0%, rgba(20,25,35,0) 100%)',
              border: '1px solid #10B981',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2), inset 0 0 10px rgba(16, 185, 129, 0.1)',
              transform: 'translateY(-2px)'
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            ...(formStep === 2 && transactionType === 'outflow' ? { opacity: 0.5, filter: 'grayscale(1)' } : {})
          }}
        >
          <SouthIcon sx={{ fontSize: 32, mb: 0.5 }} />
          Credit (+)
        </Button>

        <Button
          onClick={() => handleModeSelect('outflow')}
          sx={{
            py: { xs: 2.5, sm: 3 },
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            fontSize: '1.1rem',
            borderRadius: 4,
            textTransform: 'none',
            fontWeight: 700,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            background: formStep === 2 && transactionType === 'outflow'
              ? 'linear-gradient(180deg, rgba(244,63,94,0.15) 0%, rgba(20,25,35,0) 100%)'
              : '#0f172a',
            color: '#F43F5E',
            border: formStep === 2 && transactionType === 'outflow'
              ? '1px solid #F43F5E'
              : '1px solid rgba(244, 63, 94, 0.3)',
            boxShadow: formStep === 2 && transactionType === 'outflow'
              ? '0 0 20px rgba(244, 63, 94, 0.2), inset 0 0 10px rgba(244, 63, 94, 0.1)'
              : 'inset 0 2px 4px rgba(255,255,255,0.05), 0 4px 6px rgba(0,0,0,0.3)',
            transform: formStep === 2 && transactionType === 'outflow' ? 'translateY(-2px)' : 'none',
            '&:hover': {
              background: 'linear-gradient(180deg, rgba(244,63,94,0.15) 0%, rgba(20,25,35,0) 100%)',
              border: '1px solid #F43F5E',
              boxShadow: '0 0 20px rgba(244, 63, 94, 0.2), inset 0 0 10px rgba(244, 63, 94, 0.1)',
              transform: 'translateY(-2px)'
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            ...(formStep === 2 && transactionType === 'inflow' ? { opacity: 0.5, filter: 'grayscale(1)' } : {})
          }}
        >
          <NorthIcon sx={{ fontSize: 32, mb: 0.5 }} />
          Debit (-)
        </Button>
      </div>

      {isEliteVault && (
        <Box sx={{ mt: 1, p: 2, background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <Typography sx={{ color: '#3B82F6', fontWeight: 600, mb: 2, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Trip Roster
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {tripMembers.map(member => (
              <Chip
                key={member}
                label={member}
                onDelete={() => {
                  if (setTripMembers) {
                    setTripMembers(prev => prev.filter(m => m !== member));
                  }
                }}
                sx={{
                  background: '#1E293B',
                  color: '#F8FAFC',
                  border: '1px solid #334155',
                  borderRadius: '9999px',
                  '& .MuiChip-deleteIcon': { color: '#64748B', '&:hover': { color: '#F43F5E' } }
                }}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add Member (e.g. Rahul)"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newMemberName.trim() && setTripMembers && !tripMembers.includes(newMemberName.trim())) {
                  setTripMembers(prev => [...prev, newMemberName.trim()]);
                  setNewMemberName('');
                }
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  color: '#F8FAFC',
                  borderRadius: '8px',
                  background: '#0F172A',
                  '& fieldset': { borderColor: '#334155' },
                  '&:hover fieldset': { borderColor: '#3B82F6' },
                  '&.Mui-focused fieldset': { borderColor: '#3B82F6' },
                }
              }}
            />
            <Button
              variant="outlined"
              onClick={() => {
                if (newMemberName.trim() && setTripMembers && !tripMembers.includes(newMemberName.trim())) {
                  setTripMembers(prev => [...prev, newMemberName.trim()]);
                  setNewMemberName('');
                }
              }}
              sx={{ color: '#3B82F6', borderColor: '#3B82F6', '&:hover': { background: 'rgba(59, 130, 246, 0.1)' } }}
            >
              Add
            </Button>
          </Box>
        </Box>
      )}

      {formStep === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, animation: 'slideDown 0.4s ease-out' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={resetForm} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" color={transactionType === 'inflow' ? '#10B981' : '#F43F5E'} sx={{ fontWeight: 700 }}>
              {transactionType === 'inflow' ? 'Recording a Credit' : 'Recording a Debit'}
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={paymentMethod}
            exclusive
            onChange={(_, val) => val && setPaymentMethod(val)}
            fullWidth
            sx={{
              backgroundColor: '#0F131A',
              borderRadius: '9999px',
              padding: '4px',
              border: '1px solid #1E2638',
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '9999px !important',
                transition: 'all 0.3s ease',
                color: '#94A3B8',
              },
              '& .MuiToggleButton-root.Mui-selected': {
                color: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
                backgroundColor: transactionType === 'inflow' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: transactionType === 'inflow' ? '1px solid #10B981' : '1px solid #F43F5E',
              }
            }}
          >
            <ToggleButton value="online" sx={{ fontWeight: 600 }}> Online</ToggleButton>
            <ToggleButton value="offline" sx={{ fontWeight: 600 }}> Offline (Cash)</ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <div className="w-full sm:flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
                Amount (₹)
              </label>
              <div className="relative w-full">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => {
                    const sanitized = e.target.value.replace(/[^0-9.]/g, '');
                    if ((sanitized.match(/\./g) || []).length > 1) return;
                    setAmountStr(sanitized);
                  }}
                  className={`w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-3 text-sm text-slate-100 focus:outline-none transition-colors ${transactionType === 'inflow' ? 'focus:border-emerald-500' : 'focus:border-rose-500'
                    }`}
                  style={{
                    backgroundColor: '#0F131A',
                    border: '1px solid #1E2638',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '0.875rem',
                    color: '#F8FAFC',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div className="w-full sm:flex-1">
              <div className="flex items-center justify-between mb-1 px-1">
                <label className="text-xs font-semibold text-slate-300">Category</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="text-[11px] font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/50"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Categories
                </button>
              </div>
              <div className="relative w-full">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={`w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-3 text-sm text-slate-100 focus:outline-none transition-colors appearance-none cursor-pointer ${transactionType === 'inflow' ? 'focus:border-emerald-500' : 'focus:border-rose-500'
                    }`}
                  style={{
                    backgroundColor: '#0F131A',
                    border: '1px solid #1E2638',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    fontSize: '0.875rem',
                    color: '#F8FAFC',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                >
                  {currentCategories.map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: '#0F131A', color: '#F8FAFC' }}>
                      {c}
                    </option>
                  ))}
                </select>
                {/* Down Chevron Icon anchored right */}
                <div
                  className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400"
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    color: '#94A3B8',
                    fontSize: '0.65rem'
                  }}
                >
                  ▼
                </div>
              </div>

              {/* Sub-Category Quick Selector */}
              {category && availableSubCategories.length > 0 && (
                <div className="mt-3 flex flex-col gap-1.5 animate-fadeIn">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Sub-Category
                  </label>
                  <div className="flex flex-wrap items-center gap-1.5 py-1">
                    {availableSubCategories.map((sub: string) => {
                      const isSelected = subCategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => setSubCategory(isSelected ? '' : sub)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all duration-150 ${isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                            }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Box>

          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 px-1">
              Description / Purpose (Optional)
            </label>
            <div className="relative w-full">
              <input
                type="text"
                placeholder="e.g. Flight, Dinner, Shopping"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full bg-slate-900/80 border border-slate-700/60 rounded-xl px-3.5 py-3 text-sm text-slate-100 focus:outline-none transition-colors ${transactionType === 'inflow' ? 'focus:border-emerald-500' : 'focus:border-rose-500'
                  }`}
                style={{
                  backgroundColor: '#0F131A',
                  border: '1px solid #1E2638',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '0.875rem',
                  color: '#F8FAFC',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {isEliteVault && tripMembers.length > 0 && (
            <Box sx={{ mt: 1, p: 2, background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', border: '1px dashed #334155' }}>
              <Typography sx={{ color: '#94A3B8', fontWeight: 600, mb: 1.5, fontSize: '0.875rem' }}>
                Split this expense with:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {tripMembers.map(member => {
                  const isSelected = selectedSplitters.includes(member);
                  return (
                    <Chip
                      key={member}
                      label={member}
                      onClick={() => {
                        setSelectedSplitters(prev =>
                          prev.includes(member) ? prev.filter(m => m !== member) : [...prev, member]
                        );
                      }}
                      sx={{
                        background: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        color: isSelected ? '#3B82F6' : '#94A3B8',
                        border: `1px solid ${isSelected ? '#3B82F6' : '#334155'}`,
                        borderRadius: '9999px',
                        padding: '4px 12px',
                        transition: 'all 0.2s',
                        '&:hover': {
                          background: isSelected ? 'rgba(59, 130, 246, 0.3)' : 'rgba(51, 65, 85, 0.5)'
                        }
                      }}
                    />
                  );
                })}
              </Box>
              {selectedSplitters.length > 0 && amountStr && !isNaN(parseFloat(amountStr)) && (
                <Typography sx={{ mt: 2, color: '#3B82F6', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', animation: 'slideDown 0.3s ease' }}>
                  (Split {selectedSplitters.length} ways: ₹{Math.round(parseFloat(amountStr) / selectedSplitters.length)} per person)
                </Typography>
              )}
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={isHighlight}
                onChange={(e) => setIsHighlight(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
                    '& + .MuiSwitch-track': {
                      backgroundColor: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
                    },
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.875rem' }}>
                Mark as Highlight (Optional)
              </Typography>
            }
            sx={{ ml: 0 }}
          />

          <Button
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!amountStr}
            sx={{
              borderRadius: 8,
              mt: 1,
              py: 1.5,
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#fff',
              background: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
              boxShadow: transactionType === 'inflow'
                ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                : '0 4px 20px rgba(244, 63, 94, 0.4)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: transactionType === 'inflow' ? '#059669' : '#E11D48',
                boxShadow: transactionType === 'inflow'
                  ? '0 6px 24px rgba(16, 185, 129, 0.5)'
                  : '0 6px 24px rgba(244, 63, 94, 0.5)',
              },
              '&:active': {
                transform: 'scale(0.98)',
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.2)',
                boxShadow: 'none'
              }
            }}
          >
            Record Transaction
          </Button>
        </Box>
      )}

      {/* Category & Sub-Category Manager Modal */}
      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        categoriesMap={categoriesMap}
        onSave={saveCategories}
      />
    </MetallicCard>
  );
};
