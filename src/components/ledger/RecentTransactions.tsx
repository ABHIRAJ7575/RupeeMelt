import React from 'react';
import { Box, Typography } from '@mui/material';
import type { LedgerTransaction } from '../../lib/supabase';

export interface RecentTransactionsProps {
  transactions: LedgerTransaction[];
  isIncognito?: boolean;
  handleDeleteTransaction?: (id: string) => void;
  onDeleteTransaction?: (id: string) => void;
  isEliteVault?: boolean;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  transactions,
  isIncognito = false,
  handleDeleteTransaction,
  onDeleteTransaction,
}) => {
  const handleDelete = (id: string) => {
    if (handleDeleteTransaction) {
      handleDeleteTransaction(id);
    } else if (onDeleteTransaction) {
      onDeleteTransaction(id);
    }
  };

  // Sort chronologically ascending to compute cumulative ledger balance
  const chronological = [...transactions].sort((a: any, b: any) => {
    const timeA = new Date(a.date || a.timestamp || a.created_at).getTime();
    const timeB = new Date(b.date || b.timestamp || b.created_at).getTime();
    return timeA - timeB;
  });

  let currentTotal = 0;
  const balanceMap = new Map<string, number>();

  chronological.forEach((tx: any) => {
    const amt = Number(tx.amount !== undefined ? tx.amount : (tx.amount_paisa / 100)) || 0;
    if (tx.type === 'credit' || tx.type === 'inflow' || tx.transaction_direction === 'inflow') {
      currentTotal += amt;
    } else {
      currentTotal -= amt;
    }
    balanceMap.set(tx.id, currentTotal);
  });

  // Map runningBalance and subCategory onto each transaction and sort newest first for display
  const displayTransactions = [...transactions]
    .sort((a: any, b: any) => {
      const timeA = new Date(a.date || a.timestamp || a.created_at).getTime();
      const timeB = new Date(b.date || b.timestamp || b.created_at).getTime();
      return timeB - timeA;
    })
    .map((tx: any) => {
      const subCatMatch = tx.description?.match(/\[SUB:([^\]]+)\]/);
      const subCategory = tx.subCategory || tx.sub_category || (subCatMatch ? subCatMatch[1] : undefined);
      return {
        ...tx,
        subCategory,
        amount: tx.amount !== undefined ? tx.amount : (tx.amount_paisa / 100),
        runningBalance: balanceMap.get(tx.id) ?? 0,
      };
    });

  return (
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
        {displayTransactions.map((tx: any) => {
          const isCredit = tx.type === 'credit' || tx.type === 'inflow' || tx.transaction_direction === 'inflow';
          const isHighlighted = tx.description?.includes('[HIGHLIGHT]');
          const displayDescription = tx.description
            ?.replace(/\[SUB:[^\]]+\]/g, '')
            .replace('[HIGHLIGHT]', '')
            .replace('[ELITE]', '')
            .trim();

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
                <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                  <span className="font-medium text-slate-300 truncate">{tx.category}</span>
                  {tx.subCategory && tx.subCategory !== 'General' && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="text-cyan-400/90 font-medium truncate">{tx.subCategory}</span>
                    </>
                  )}
                  {displayDescription && (
                    <span className="text-slate-400 truncate text-xs">- {displayDescription}</span>
                  )}
                </div>
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
                  {new Date(tx.created_at || tx.date || tx.timestamp).toLocaleDateString()} • {tx.payment_method}
                </Typography>
              </div>

              {/* Right Side: Amount, Running Balance, and Actions */}
              <div className="shrink-0 flex items-center gap-3">
                <div className="flex flex-col items-end">
                  {/* Transaction Amount */}
                  <span className={`font-mono font-bold text-xs sm:text-sm tracking-tight transition-all duration-200 ${
                    isCredit ? 'text-emerald-400' : 'text-rose-400'
                  } ${isIncognito ? 'blur-sm select-none' : ''}`}>
                    {isCredit ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>

                  {/* Passbook Running Balance */}
                  <span className={`text-[10px] font-mono text-slate-400 tracking-tight transition-all duration-200 ${
                    isIncognito ? 'blur-sm select-none' : ''
                  }`}>
                    Bal: ₹{Number(tx.runningBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Delete Action Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(tx.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                  aria-label="Delete transaction"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
        {displayTransactions.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#64748B' }}>No recent transactions.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};
