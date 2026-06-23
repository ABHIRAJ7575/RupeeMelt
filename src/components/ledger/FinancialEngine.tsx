import React, { useState } from 'react';
import { Box, Typography, Button, TextField, ToggleButton, ToggleButtonGroup, FormControl, InputLabel, Select, MenuItem, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import type { SelectChangeEvent } from '@mui/material';
import { MetallicCard } from '../ui/MetallicCard';

interface FinancialEngineProps {
  onRecordTransaction: (amountPaisa: number, type: 'inflow' | 'outflow', paymentMethod: 'online' | 'offline', category: string, desc: string) => Promise<void>;
}

export const FinancialEngine: React.FC<FinancialEngineProps> = ({ onRecordTransaction }) => {
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'inflow' | 'outflow'>('outflow');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'offline'>('online');
  const [category, setCategory] = useState('Food');

  const categories = ['Salary', 'Food', 'Travel', 'Entertainment', 'Utilities', 'Shopping', 'Other'];

  const handleModeSelect = (mode: 'inflow' | 'outflow') => {
    setTransactionType(mode);
    setFormStep(2);
  };

  const resetForm = () => {
    setFormStep(1);
    setAmountStr('');
    setDescription('');
    setCategory('Food');
  };

  const handleSubmit = async () => {
    const amount = parseFloat(amountStr);
    if (!isNaN(amount) && amount > 0) {
      const paisa = Math.round(amount * 100);
      await onRecordTransaction(paisa, transactionType, paymentMethod, category, description);
      resetForm();
    }
  };

  return (
    <MetallicCard sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {formStep === 1 && (
        <>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700, mb: 1 }}>
            Ledger Engine
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
            <Button
              variant="contained"
              onClick={() => handleModeSelect('inflow')}
              sx={{
                flex: 1,
                py: 4,
                fontSize: '1.25rem',
                borderRadius: 4,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  boxShadow: '0 12px 48px rgba(16, 185, 129, 0.3)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Deposit / Inflow
            </Button>
            <Button
              variant="contained"
              onClick={() => handleModeSelect('outflow')}
              sx={{
                flex: 1,
                py: 4,
                fontSize: '1.25rem',
                borderRadius: 4,
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                color: '#F43F5E',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                boxShadow: '0 8px 32px rgba(244, 63, 94, 0.15)',
                transition: 'all 0.3s',
                '&:hover': {
                  backgroundColor: 'rgba(244, 63, 94, 0.2)',
                  boxShadow: '0 12px 48px rgba(244, 63, 94, 0.3)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Withdraw / Expense
            </Button>
          </Box>
        </>
      )}

      {formStep === 2 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={resetForm} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" color={transactionType === 'inflow' ? '#10B981' : '#F43F5E'} sx={{ fontWeight: 700 }}>
              {transactionType === 'inflow' ? 'Recording a Deposit' : 'Recording an Expense'}
            </Typography>
          </Box>

          <ToggleButtonGroup
            value={paymentMethod}
            exclusive
            onChange={(_, val) => val && setPaymentMethod(val)}
            fullWidth
            sx={{ 
              borderRadius: 2,
              '& .MuiToggleButton-root.Mui-selected': {
                color: transactionType === 'inflow' ? '#10B981' : '#F43F5E',
                backgroundColor: transactionType === 'inflow' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)',
              }
            }}
          >
            <ToggleButton value="online" sx={{ fontWeight: 600 }}>💳 Online</ToggleButton>
            <ToggleButton value="offline" sx={{ fontWeight: 600 }}>💵 Offline (Cash)</ToggleButton>
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
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  '&::before, &::after': { display: 'none' }
                }
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                variant="filled"
                onChange={(e: SelectChangeEvent) => setCategory(e.target.value)}
                sx={{
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  '&::before, &::after': { display: 'none' }
                }}
              >
                {categories.map((c) => (
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
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                '&::before, &::after': { display: 'none' }
              }
            }}
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
              fontWeight: 700, 
              fontSize: '1.1rem',
              background: 'linear-gradient(to right, #3B82F6, #6366F1)',
              color: '#fff',
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-1px)',
                background: 'linear-gradient(to right, #3B82F6, #6366F1)'
              },
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            Record Transaction
          </Button>
        </>
      )}
    </MetallicCard>
  );
};
