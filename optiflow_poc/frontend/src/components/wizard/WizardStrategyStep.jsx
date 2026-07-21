import { useState, useEffect, useContext } from 'react';
import { getStrategy, updateStrategy, runAllocation } from '../../api';
import { DataContext } from '../../DataContext';

const TIER_COLORS = {
  'A++': { bg: '#4f2dbd', text: '#fff', bar: '100%' },
  'A+':  { bg: '#6b41d1', text: '#fff', bar: '85%' },
  'A':   { bg: '#8859e0', text: '#fff', bar: '70%' },
  'B+':  { bg: '#e8a020', text: '#fff', bar: '55%' },
  'B':   { bg: '#e07020', text: '#fff', bar: '40%' },
  'C':   { bg: '#9b3e3e', text: '#fff', bar: '25%' },
};

function PriorityLadder({ categories, activeCategories, onToggle, onRun, running }) {
  return (
    <div className="card" style={{ padding: '14px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' }}>
          Allocation Priority Order
        </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {categories.map((cat, i) => {
          const color = TIER_COLORS[cat] || { bg: 'var(--border)', text: 'var(--text-primary)' };
          const barWidth = TIER_COLORS[cat]?.bar || '30%';
          const isEnabled = activeCategories.includes(cat);
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div
                  onClick={() => onToggle(cat)}
                  title={isEnabled ? 'Click to exclude from allocation' : 'Click to include in allocation'}
                  style={{
                    background: isEnabled ? color.bg : 'var(--border)',
                    color: isEnabled ? color.text : 'var(--text-muted)',
                    borderRadius: 6, padding: '4px 12px',
                    fontSize: 13, fontWeight: 800,
                    cursor: 'pointer',
                    opacity: isEnabled ? 1 : 0.45,
                    transition: 'all 0.2s',
                    userSelect: 'none',
                    textDecoration: isEnabled ? 'none' : 'line-through',
                  }}
                >
                  {cat}
                </div>
                <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: isEnabled ? barWidth : '0%', height: '100%', background: color.bg, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
              </div>
              {i < categories.length - 1 && (
                <div style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 6 }}>›</div>
              )}
            </div>
          );
        })}
        </div>
      </div>
      <div>
        <button 
          className="btn btn-primary" 
          style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }} 
          onClick={onRun}
          disabled={running}
        >
          {running ? 'Running...' : 'Run Allocation Engine →'}
        </button>
      </div>
    </div>
  );
}

export default function WizardStrategyStep({ onComplete }) {
  const { refreshData } = useContext(DataContext);
  const [categories, setCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [columns, setColumns] = useState({});
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getStrategy();
      const cats = data.categories || [];
      setCategories(cats);
      setActiveCategories(data.active_categories || []);
      setColumns(data.columns || {});
      if (cats.length > 0) setActiveTab(cats[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat) => {
    setActiveCategories(prev => {
      if (prev.includes(cat)) return prev.filter(c => c !== cat);
      const newActive = [...prev, cat];
      return categories.filter(c => newActive.includes(c));
    });
  };

  const moveStoreUp = (catId, storeIndex) => {
    if (storeIndex === 0) return;
    setColumns(prev => {
      const col = [...prev[catId]];
      [col[storeIndex - 1], col[storeIndex]] = [col[storeIndex], col[storeIndex - 1]];
      return { ...prev, [catId]: col };
    });
  };

  const moveStoreDown = (catId, storeIndex) => {
    setColumns(prev => {
      const col = [...prev[catId]];
      if (storeIndex === col.length - 1) return prev;
      [col[storeIndex + 1], col[storeIndex]] = [col[storeIndex], col[storeIndex + 1]];
      return { ...prev, [catId]: col };
    });
  };

  const moveStoreToTier = (fromCat, storeIndex, targetCat) => {
    setColumns(prev => {
      const sourceCol = [...prev[fromCat]];
      const targetCol = [...(prev[targetCat] || [])];
      const [store] = sourceCol.splice(storeIndex, 1);
      store.category = targetCat;
      targetCol.push(store);
      return { ...prev, [fromCat]: sourceCol, [targetCat]: targetCol };
    });
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      setError(null);
      const payload = {
        category_stores: {},
        active_categories: activeCategories
      };
      Object.keys(columns).forEach(cat => {
        payload.category_stores[cat] = columns[cat].map(s => s.store_name);
      });
      await updateStrategy(payload);
      await runAllocation();
      refreshData();
      onComplete();
    } catch (err) {
      setError(err.message);
      setRunning(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-in" style={{ padding: '10px 0' }}>
        <div className="skeleton skeleton-card" style={{ height: 80, marginBottom: 20 }}></div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: 80, height: 35, borderRadius: 20, marginBottom: 0 }}></div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div className="skeleton skeleton-text" style={{ width: '30%', height: 24, marginBottom: 20 }}></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ width: '100%', height: 40, marginBottom: 10, borderRadius: 6 }}></div>
          ))}
        </div>
      </div>
    );
  }

  const activeStores = columns[activeTab] || [];
  const catIndex = categories.indexOf(activeTab);

  return (
    <div className="animate-in">
      {/* Priority Ladder */}
      <PriorityLadder categories={categories} activeCategories={activeCategories} onToggle={toggleCategory} onRun={handleRun} running={running} />

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 0, borderBottom: '2px solid var(--border)' }}>
        {categories.map(cat => {
          const isActive = cat === activeTab;
          const isEnabled = activeCategories.includes(cat);
          const color = TIER_COLORS[cat] || {};
          const storeCount = (columns[cat] || []).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              style={{
                padding: '10px 18px',
                fontWeight: 700,
                fontSize: 13,
                border: 'none',
                borderBottom: isActive ? `3px solid ${color.bg}` : '3px solid transparent',
                background: isActive ? `${color.bg}18` : 'transparent',
                color: isActive ? color.bg : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                opacity: isEnabled ? 1 : 0.45,
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span>{cat}</span>
              <span style={{
                background: isActive ? color.bg : 'var(--border)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px'
              }}>{storeCount}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab && (
        <div className="card animate-in" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: 0, overflow: 'hidden' }}>
          {/* Tab header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: TIER_COLORS[activeTab]?.bg || 'var(--primary)' }}>{activeTab} Tier</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{activeStores.length} stores · ranked top-to-bottom</span>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={activeCategories.includes(activeTab)}
                onChange={() => toggleCategory(activeTab)}
                style={{ cursor: 'pointer', width: 15, height: 15 }}
              />
              Include in Allocation
            </label>
          </div>

          {/* Store List */}
          <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeStores.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>No stores in this tier</div>
            ) : (
              activeStores.map((store, storeIndex) => (
                <div key={store.store_name} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                  background: storeIndex % 2 === 0 ? 'var(--bg-surface)' : 'transparent',
                  borderRadius: 6, border: '1px solid var(--border)',
                }}>
                  {/* Rank badge */}
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: storeIndex < 3 ? (TIER_COLORS[activeTab]?.bg || 'var(--primary)') : 'var(--border)',
                    color: storeIndex < 3 ? '#fff' : 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, flexShrink: 0
                  }}>
                    {storeIndex + 1}
                  </div>

                  {/* Store name */}
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={store.store_name}>
                    {store.store_name}
                  </div>

                  {/* Move tier dropdown */}
                  <select
                    value={activeTab}
                    onChange={e => { moveStoreToTier(activeTab, storeIndex, e.target.value); }}
                    style={{ fontSize: 11, padding: '3px 6px', borderRadius: 4, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  {/* Up/Down controls */}
                  <div style={{ display: 'flex', gap: 1 }}>
                    <button
                      onClick={() => moveStoreUp(activeTab, storeIndex)} disabled={storeIndex === 0}
                      title="Move up in priority"
                      style={{ padding: '3px 5px', background: 'none', border: '1px solid var(--border)', borderRadius: '4px 0 0 4px', cursor: storeIndex === 0 ? 'not-allowed' : 'pointer', opacity: storeIndex === 0 ? 0.25 : 0.8 }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => moveStoreDown(activeTab, storeIndex)} disabled={storeIndex === activeStores.length - 1}
                      title="Move down in priority"
                      style={{ padding: '3px 5px', background: 'none', border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 4px 4px 0', cursor: storeIndex === activeStores.length - 1 ? 'not-allowed' : 'pointer', opacity: storeIndex === activeStores.length - 1 ? 0.25 : 0.8 }}
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <div className="card" style={{ color: 'var(--danger)', marginTop: 16, fontSize: 13, fontWeight: 600 }}>Error: {error}</div>}


    </div>
  );
}
