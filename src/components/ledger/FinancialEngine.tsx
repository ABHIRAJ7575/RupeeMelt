import React, { useState } from 'react';
import { Box, Typography, Button, TextField, ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem, IconButton, FormControlLabel, Switch, Chip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SouthIcon from '@mui/icons-material/South';
import NorthIcon from '@mui/icons-material/North';
import type { SelectChangeEvent } from '@mui/material';
import { MetallicCard } from '../ui/MetallicCard';

interface FinancialEngineProps {
  onRecordTransaction: (amountPaisa: number, type: 'inflow' | 'outflow', paymentMethod: 'online' | 'offline', category: string, desc: string) => Promise<void>;
  isEliteVault?: boolean;
  tripMembers?: string[];
  setTripMembers?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const FinancialEngine: React.FC<FinancialEngineProps> = ({ onRecordTransaction, isEliteVault = false, tripMembers = [], setTripMembers }) => {
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'inflow' | 'outflow'>('outflow');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [category, setCategory] = useState('Others');

  const [isHighlight, setIsHighlight] = useState(false);

  // Trip Splitter State
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedSplitters, setSelectedSplitters] = useState<string[]>([]);

  const currentCategories = isEliteVault
    ? (transactionType === 'inflow' ? ['Trip Fund Collection', 'Refund', 'Others'] : ['Flight/Train', 'Hotel/Stay', 'Food & Drinks', 'Cab/Transport', 'Activities', 'Others'])
    : (transactionType === 'inflow' ? ['Salary', 'Cashback', 'Cash into Bank', 'Others'] : ['Pulsar 150', 'Eco-Sport', 'Meteor 350', 'Activa H-Smart', 'Family Food/Outing Expenses', 'Personal Outing', 'Personal Fast-Food', 'Home Expenses', 'Personal Shopping', 'Family Shopping', 'MBA', 'SIP', 'To Family', 'To Friends', 'To Parents', 'Paying Loan', 'Cell Phone Recharge', 'Others']);

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
    setIsHighlight(false);
    setSelectedSplitters([]);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      const paisa = Math.round(amount * 100);
      let finalDescription = isHighlight ? description + (description ? ' ' : '') + '[HIGHLIGHT]' : description;

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

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: '16px',
        position: 'relative'
      }}>
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
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            fontSize: '1.25rem',
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
          <SouthIcon sx={{ fontSize: 40, mb: 1 }} />
          Credit (+)
        </Button>

        <Button
          onClick={() => handleModeSelect('outflow')}
          sx={{
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            fontSize: '1.25rem',
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
          <NorthIcon sx={{ fontSize: 40, mb: 1 }} />
          Debit (-)
        </Button>
      </Box>

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
            <TextField
              fullWidth
              label="Amount (₹)"
              variant="filled"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => {
                const sanitized = e.target.value.replace(/[^0-9.]/g, '');
                if ((sanitized.match(/\./g) || []).length > 1) return;
                setAmountStr(sanitized);
              }}
              sx={{
                '& .MuiFilledInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#0F131A',
                  border: '1px solid #1E2638',
                  color: '#F8FAFC',
                  transition: 'all 0.3s ease',
                  '&::before, &::after': { display: 'none' },
                  '&:focus-within': {
                    borderColor: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
                    boxShadow: transactionType === 'inflow' ? '0 0 12px rgba(16, 185, 129, 0.25)' : '0 0 12px rgba(244, 63, 94, 0.25)'
                  }
                },
                '& .MuiInputLabel-root': { color: '#94A3B8' },
                '& .MuiInputLabel-root.Mui-focused': { color: transactionType === 'inflow' ? '#10B981' : '#F43F5E' },
              }}
            />

            <FormControl fullWidth sx={{
              '& .MuiInputLabel-root': { color: '#94A3B8' },
              '& .MuiInputLabel-root.Mui-focused': { color: transactionType === 'inflow' ? '#10B981' : '#F43F5E' },
            }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                variant="filled"
                onChange={(e: SelectChangeEvent) => setCategory(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: '#0F131A',
                  border: '1px solid #1E2638',
                  color: '#F8FAFC',
                  transition: 'all 0.3s ease',
                  '&::before, &::after': { display: 'none' },
                  '&:focus-within': {
                    borderColor: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
                    boxShadow: transactionType === 'inflow' ? '0 0 12px rgba(16, 185, 129, 0.25)' : '0 0 12px rgba(244, 63, 94, 0.25)'
                  }
                }}
              >
                {currentCategories.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            fullWidth
            label="Description / Purpose (Optional)"
            variant="filled"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{
              '& .MuiFilledInput-root': {
                borderRadius: '12px',
                backgroundColor: '#0F131A',
                border: '1px solid #1E2638',
                color: '#F8FAFC',
                transition: 'all 0.3s ease',
                '&::before, &::after': { display: 'none' },
                '&:focus-within': {
                  borderColor: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
                  boxShadow: transactionType === 'inflow' ? '0 0 12px rgba(16, 185, 129, 0.25)' : '0 0 12px rgba(244, 63, 94, 0.25)'
                }
              },
              '& .MuiInputLabel-root': { color: '#94A3B8' },
              '& .MuiInputLabel-root.Mui-focused': { color: transactionType === 'inflow' ? '#10B981' : '#F43F5E' },
            }}
          />

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
    </MetallicCard>
  );
};
