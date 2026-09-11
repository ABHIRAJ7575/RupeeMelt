import type { LedgerTransaction } from './supabase';

/**
 * Extracts the sub-category from transaction properties or embedded description tags.
 */
export const getTransactionSubCategory = (tx: Partial<LedgerTransaction> | any): string | undefined => {
  if (!tx) return undefined;
  const subCatMatch = tx.description?.match(/\[SUB:([^\]]+)\]/);
  return tx.subCategory || tx.sub_category || (subCatMatch ? subCatMatch[1] : undefined);
};

/**
 * Strict detection: ONLY genuine internal transfers/ATM conversions.
 * Prevents Cashback and normal inflows/expenses from being falsely detected as transfers.
 */
export const isInternalTransfer = (tx: Partial<LedgerTransaction> | any): boolean => {
  if (!tx) return false;
  const subCategory = getTransactionSubCategory(tx);
  const cat = tx.category?.toLowerCase();
  const sub = subCategory?.toLowerCase();

  return Boolean(
    tx.isTransfer === true ||
    tx.is_transfer === true ||
    tx.type === 'transfer' ||
    (cat && (
      cat === 'internal transfer' ||
      cat.startsWith('internal') ||
      cat === 'transfer'
    )) ||
    (sub && (
      sub === 'atm withdrawal' ||
      sub === 'cash conversion'
    ))
  ) && !cat?.includes('cashback') && !sub?.includes('cashback');
};


/**
 * Derives transfer metadata including directional flow and primary badging label.
 * Directional flow: ${sourceMode || (isDebit ? 'Online' : 'Cash')} ➔ ${targetMode || (isDebit ? 'Cash' : 'Online')}
 * Primary label: "Cash Conversion" if cash/ATM is involved, otherwise "Account Transfer".
 */
export const getTransferMetadata = (tx: Partial<LedgerTransaction> | any) => {
  const subCategory = getTransactionSubCategory(tx);
  const cat = tx.category?.toLowerCase() || '';
  const sub = subCategory?.toLowerCase() || '';
  const desc = (tx.description || tx.note || '').toLowerCase();

  const isAtm = desc.includes('atm') || sub === 'atm withdrawal' || cat.includes('atm');
  const isCashConversion = isAtm || sub === 'cash conversion' || desc.includes('cash conversion');

  if (isAtm || isCashConversion) {
    return {
      isDebit: true,
      sourceMode: 'Online',
      targetMode: 'Cash',
      flowDirection: 'Online ➔ Cash',
      primaryLabel: 'Cash Conversion',
    };
  }

  const isDebit = tx.type === 'debit' || tx.type === 'outflow' || tx.transaction_direction === 'outflow';
  const sourceMode = tx.sourceMode || tx.source_mode || (isDebit ? 'Online' : 'Cash');
  const targetMode = tx.targetMode || tx.target_mode || (isDebit ? 'Cash' : 'Online');
  const flowDirection = `${sourceMode} ➔ ${targetMode}`;

  const isCashRelated =
    sub.includes('cash') ||
    cat.includes('cash') ||
    desc.includes('cash') ||
    tx.payment_method === 'offline' ||
    sourceMode.toLowerCase().includes('cash') ||
    targetMode.toLowerCase().includes('cash');

  const primaryLabel = isCashRelated ? 'Cash Conversion' : 'Account Transfer';

  return {
    isDebit,
    sourceMode,
    targetMode,
    flowDirection,
    primaryLabel,
  };
};
