import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStrategy, updateStrategy, runAllocation } from '../api';

export default function StrategyPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [columns, setColumns] = useState({});
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await getStrategy();
      setCategories(data.categories || []);
      setActiveCategories(data.active_categories || []);
      setColumns(data.columns || {});
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
      const temp = col[storeIndex - 1];
      col[storeIndex - 1] = col[storeIndex];
      col[storeIndex] = temp;
      return { ...prev, [catId]: col };
    });
  };

  const moveStoreDown = (catId, storeIndex) => {
    setColumns(prev => {
      const col = [...prev[catId]];
      if (storeIndex === col.length - 1) return prev;
      const temp = col[storeIndex + 1];
      col[storeIndex + 1] = col[storeIndex];
      col[storeIndex] = temp;
      return { ...prev, [catId]: col };
    });
  };

  const moveStoreLeft = (catId, storeIndex) => {
    const catIndex = categories.indexOf(catId);
    if (catIndex <= 0) return;
    const targetCatId = categories[catIndex - 1];
    
    setColumns(prev => {
      const sourceCol = [...prev[catId]];
      const targetCol = [...(prev[targetCatId] || [])];
      
      const store = sourceCol.splice(storeIndex, 1)[0];
      store.category = targetCatId;
      targetCol.push(store);
      
      return { ...prev, [catId]: sourceCol, [targetCatId]: targetCol };
    });
  };

  const moveStoreRight = (catId, storeIndex) => {
    const catIndex = categories.indexOf(catId);
    if (catIndex === -1 || catIndex >= categories.length - 1) return;
    const targetCatId = categories[catIndex + 1];
    
    setColumns(prev => {
      const sourceCol = [...prev[catId]];
      const targetCol = [...(prev[targetCatId] || [])];
      
      const store = sourceCol.splice(storeIndex, 1)[0];
      store.category = targetCatId;
      targetCol.push(store);
      
      return { ...prev, [catId]: sourceCol, [targetCatId]: targetCol };
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
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="page-header"><h2>Loading Strategy...</h2></div>;
  }

  if (loading) {
    return <div className="page-header"><h2>Loading Strategy...</h2></div>;
  }

  return (
    <div>
      <div className="page-header animate-in">
        <h2 style={{ fontSize: 32, marginBottom: 8 }}>Allocation Strategy</h2>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>Use the arrows to rank stores. The system allocates inventory to the checked columns first, from top to bottom.</p>
        <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>Efficiency Bar:</span>
            <div style={{ width: 60, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '65%', background: 'var(--accent)', borderRadius: 3 }}></div>
            </div>
          </div>
          <div style={{ width: 1, height: 24, background: 'var(--border)' }}></div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Sell-Through Rate (STR). Shows how efficiently this store clears its inventory.
          </p>
        </div>
      </div>

      {error && <div className="card" style={{ color: 'var(--danger)', marginBottom: 16, fontSize: 13, fontWeight: 600 }}>Error: {error}</div>}

      <div className="card animate-in" style={{ marginBottom: 24, padding: '16px 20px', display: 'flex', gap: 24, alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleRun} disabled={running}>
          {running ? 'Allocating...' : 'Save & Run Allocation'}
        </button>
      </div>

      <div className="animate-in" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
        {categories.map((cat, catIndex) => {
          const stores = columns[cat] || [];
          const active = activeCategories.includes(cat);
          
          // Calculate column average for recommendations based on STR
          const colAvg = stores.length > 0 
            ? stores.reduce((sum, s) => sum + (s.str_pct || 0), 0) / stores.length 
            : 0;
          
          return (
            <div key={cat} style={{
              flex: '0 0 320px',
              background: active ? 'rgba(59,35,123,0.02)' : 'rgba(0,0,0,0.02)',
              border: '1px solid var(--border)',
              opacity: active ? 1 : 0.6,
              borderRadius: 8,
              padding: 12,
              minHeight: 400,
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, borderBottom: '2px solid var(--border)', paddingBottom: 12 }}>
                <input 
                  type="checkbox" 
                  checked={active} 
                  onChange={() => toggleCategory(cat)} 
                  style={{ cursor: 'pointer', width: 18, height: 18 }}
                />
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 17 }}>
                  {cat} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>({stores.length})</span>
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stores.map((store, storeIndex) => {
                  const volPct = Math.min(store.str_pct || 0, 100);
                  
                  // Recommendation logic based on STR
                  let recommendation = null;
                  if (colAvg > 0 && stores.length > 2) {
                    if (store.str_pct > colAvg * 1.3 && catIndex > 0) {
                      recommendation = <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 700, background: 'rgba(39, 174, 96, 0.1)', padding: '3px 8px', borderRadius: 12 }}>↑ Promote</span>;
                    } else if (store.str_pct < colAvg * 0.7 && catIndex < categories.length - 1) {
                      recommendation = <span style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 700, background: 'rgba(231, 76, 60, 0.1)', padding: '3px 8px', borderRadius: 12 }}>↓ Demote</span>;
                    }
                  }

                  return (
                    <div key={store.store_name} style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '14px 16px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 15, lineHeight: 1.3, marginBottom: 4 }}>
                            {store.store_name}
                          </div>
                          {recommendation && <div style={{ marginBottom: 4 }}>{recommendation}</div>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 4, background: 'rgba(59,35,123,0.04)', padding: 4, borderRadius: 6, width: 'fit-content' }}>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '2px 8px', fontSize: 14, height: 'auto', minWidth: 'auto', background: 'transparent' }}
                          onClick={() => moveStoreLeft(cat, storeIndex)}
                          disabled={catIndex === 0}
                          title="Move to previous tier"
                        >←</button>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '2px 8px', fontSize: 14, height: 'auto', minWidth: 'auto', background: 'transparent' }}
                          onClick={() => moveStoreUp(cat, storeIndex)}
                          disabled={storeIndex === 0}
                          title="Move up in tier"
                        >↑</button>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '2px 8px', fontSize: 14, height: 'auto', minWidth: 'auto', background: 'transparent' }}
                          onClick={() => moveStoreDown(cat, storeIndex)}
                          disabled={storeIndex === stores.length - 1}
                          title="Move down in tier"
                        >↓</button>
                        <button 
                          className="btn btn-ghost" 
                          style={{ padding: '2px 8px', fontSize: 14, height: 'auto', minWidth: 'auto', background: 'transparent' }}
                          onClick={() => moveStoreRight(cat, storeIndex)}
                          disabled={catIndex === categories.length - 1}
                          title="Move to next tier"
                        >→</button>
                      </div>

                      <div style={{ width: '100%', height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', marginTop: 14 }}>
                        <div style={{ height: '100%', width: `${volPct}%`, background: 'var(--accent)', borderRadius: 3 }}></div>
                      </div>
                    </div>
                  );
                })}
                {stores.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '20px 0' }}>
                    No stores in this tier.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
