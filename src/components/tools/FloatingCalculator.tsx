import React, { useState } from 'react';
import { Fab, Dialog, DialogTitle, DialogContent, Box, Typography, TextField, IconButton } from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import CloseIcon from '@mui/icons-material/Close';
import { MetallicCard } from '../ui/MetallicCard';

export const FloatingCalculator: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [expression, setExpression] = useState('');
  const [evaluatedResult, setEvaluatedResult] = useState<number | null>(null);

  const handleExpressionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[0-9+\-*/. ]*$/.test(val)) {
      setExpression(val);
      try {
        // Securely evaluate inline arithmetic using new Function isolated scope
        const result = new Function('return ' + val)();
        if (typeof result === 'number' && !isNaN(result)) {
          setEvaluatedResult(result);
        } else {
          setEvaluatedResult(null);
        }
      } catch {
        setEvaluatedResult(null);
      }
    }
  };

  return (
    <>
      <Fab 
        color="primary" 
        aria-label="calculator" 
        onClick={() => setOpen(true)}
        sx={{ 
          position: 'fixed', 
          bottom: 'clamp(16px, 4vw, 32px)', 
          right: 'clamp(16px, 4vw, 32px)',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}
      >
        <CalculateIcon />
      </Fab>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        PaperComponent={MetallicCard as any}
        sx={{
          '& .MuiDialog-paper': {
            width: '100%',
            maxWidth: '400px',
            m: 2
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Inline Evaluator</Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              fullWidth
              label="Arithmetic Expression (e.g. 1200 + 450)"
              variant="filled"
              value={expression}
              onChange={handleExpressionChange}
              autoFocus
              inputMode="tel"
              slotProps={{
                htmlInput: {
                  pattern: '[0-9+\\-*/.]*'
                }
              }}
              sx={{
                '& .MuiFilledInput-root': {
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  '&::before, &::after': { display: 'none' }
                }
              }}
            />
            
            <Box sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2, textAlign: 'center', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="h3" color="primary.main" sx={{ fontWeight: 700 }}>
                {evaluatedResult !== null ? `₹${evaluatedResult.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};


