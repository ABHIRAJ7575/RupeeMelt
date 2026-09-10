import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoriesMap: {
    debit: Record<string, string[]>;
    credit: Record<string, string[]>;
  };
  onSave: (updated: {
    debit: Record<string, string[]>;
    credit: Record<string, string[]>;
  }) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categoriesMap,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<'debit' | 'credit'>('debit');
  const [newCatName, setNewCatName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentDict = categoriesMap[activeTab] || {};
  const categoryNames = Object.keys(currentDict);

  // Auto-select first category if current selected is invalid
  const activeSelectedCategory =
    selectedCategory && currentDict[selectedCategory]
      ? selectedCategory
      : categoryNames.length > 0
      ? categoryNames[0]
      : null;

  const handleAddCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) return;

    if (currentDict[trimmed]) {
      setSelectedCategory(trimmed);
      setNewCatName('');
      return;
    }

    const updated = {
      ...categoriesMap,
      [activeTab]: {
        ...categoriesMap[activeTab],
        [trimmed]: ['General'],
      },
    };

    onSave(updated);
    setSelectedCategory(trimmed);
    setNewCatName('');
  };

  const handleDeleteCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = { ...currentDict };
    delete remaining[catToDelete];

    const updated = {
      ...categoriesMap,
      [activeTab]: remaining,
    };

    onSave(updated);
    if (activeSelectedCategory === catToDelete) {
      const remainingKeys = Object.keys(remaining);
      setSelectedCategory(remainingKeys.length > 0 ? remainingKeys[0] : null);
    }
  };

  const handleAddSubCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeSelectedCategory) return;
    const trimmed = newSubName.trim();
    if (!trimmed) return;

    const existingSubs = currentDict[activeSelectedCategory] || [];
    if (existingSubs.includes(trimmed)) {
      setNewSubName('');
      return;
    }

    const updated = {
      ...categoriesMap,
      [activeTab]: {
        ...categoriesMap[activeTab],
        [activeSelectedCategory]: [...existingSubs, trimmed],
      },
    };

    onSave(updated);
    setNewSubName('');
  };

  const handleDeleteSubCategory = (subToDelete: string) => {
    if (!activeSelectedCategory) return;
    const existingSubs = currentDict[activeSelectedCategory] || [];
    const filteredSubs = existingSubs.filter((s) => s !== subToDelete);

    const updated = {
      ...categoriesMap,
      [activeTab]: {
        ...categoriesMap[activeTab],
        [activeSelectedCategory]: filteredSubs.length > 0 ? filteredSubs : ['General'],
      },
    };

    onSave(updated);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#141923',
          border: '1px solid #1E2638',
          borderRadius: '16px',
          color: '#F8FAFC',
          p: { xs: 1.5, sm: 2.5 },
          backgroundImage: 'none',
        },
      }}
    >
      {/* Modal Header */}
      <DialogTitle
        sx={{
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#F8FAFC',
          fontSize: '1.1rem',
          fontWeight: 700,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400">Category & Sub-Category Manager</span>
        </div>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ color: '#94A3B8', '&:hover': { color: '#F43F5E' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 1, mt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Tabs: Debit vs Credit */}
        <div className="flex items-center gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('debit');
              setSelectedCategory(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'debit'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Debit (Expenses)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('credit');
              setSelectedCategory(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'credit'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credit (Inflows)
          </button>
        </div>

        {/* Add Category Input */}
        <form onSubmit={handleAddCategory} className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`New ${activeTab === 'debit' ? 'Expense' : 'Inflow'} Category...`}
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            style={{
              backgroundColor: '#0F131A',
              border: '1px solid #1E2638',
              borderRadius: '10px',
              padding: '8px 12px',
              color: '#F8FAFC',
              fontSize: '0.8rem',
            }}
          />
          <button
            type="submit"
            className="px-3 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
            style={{
              backgroundColor: '#22D3EE',
              color: '#090D16',
              borderRadius: '10px',
              padding: '8px 14px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            + Add Category
          </button>
        </form>

        {/* Categories List */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active Categories (Click to select & edit subcategories)
          </label>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-slate-800/80 rounded-xl bg-slate-950/40">
            {categoryNames.map((cat) => {
              const isSelected = activeSelectedCategory === cat;
              const subCount = (currentDict[cat] || []).length;
              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.25)]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-slate-100'
                  }`}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] text-slate-500">({subCount})</span>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCategory(cat, e)}
                    className="ml-1 text-slate-500 hover:text-rose-400 font-bold text-xs p-0.5 rounded transition-colors"
                    title="Delete Category"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {categoryNames.length === 0 && (
              <span className="text-xs text-slate-500 p-2">No categories defined yet.</span>
            )}
          </div>
        </div>

        {/* Sub-Category Editor */}
        {activeSelectedCategory && (
          <div className="flex flex-col gap-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">
                Sub-Categories for <span className="text-cyan-400">"{activeSelectedCategory}"</span>
              </label>
            </div>

            {/* Sub-Category Badges */}
            <div className="flex flex-wrap items-center gap-1.5 py-1 min-h-[32px]">
              {(currentDict[activeSelectedCategory] || []).map((sub) => (
                <span
                  key={sub}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubCategory(sub)}
                    className="text-slate-400 hover:text-rose-400 font-bold ml-1 transition-colors"
                    title="Delete Sub-category"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Inline Input to add subcategory */}
            <form onSubmit={handleAddSubCategory} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                placeholder="Add sub-category (press Enter)..."
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                style={{
                  backgroundColor: '#090D16',
                  border: '1px solid #1E2638',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  color: '#F8FAFC',
                  fontSize: '0.75rem',
                }}
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 transition-all"
                style={{
                  backgroundColor: '#1E2638',
                  color: '#67E8F9',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  cursor: 'pointer',
                }}
              >
                + Add
              </button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
