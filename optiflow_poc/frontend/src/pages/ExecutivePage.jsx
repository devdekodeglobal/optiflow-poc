import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExecutiveAnalytics } from '../api';

export default function ExecutivePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchExecData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getExecutiveAnalytics();
      if (result.status === 'ready') {
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch executive analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExecData();
  }, [fetchExecData]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div className="spinner"></div>
        <p style={{ marginTop: 16 }}>Compiling executive performance matrix...</p>
      </div>
    );
  }

  if (!data || !data.stores) {
    return (
      <div>
        <div className="page-header animate-in">
          <h2>Executive Insights</h2>
          <p>Please upload raw datasets first on the Data Ingestion page.</p>
        </div>
        <div className="empty-state card animate-in">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <h3>No Executive Analytics Available</h3>
          <p>Upload Planogram and Sales CSV files to unlock this dashboard view.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
            Go to Ingestion
          </button>
        </div>
      </div>
    );
  }

  // Helper to draw a beautiful donut chart with SVG
  const totalCategoryQty = data.categories?.reduce((sum, item) => sum + item.total_qty, 0) || 1;
  let accumulatedPercent = 0;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Executive Insights</h2>
        <p>Operational heatmaps, category distributions, and store revenue performance rankings.</p>
      </div>

      {/* KPI Cards */}
      <div className="summary-grid" style={{ marginBottom: 24 }}>
        <div className="summary-card navy">
          <div className="label">Gross Sales Revenue (6 Months Total)</div>
          <div className="value">₹{data.total_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="sub">Gross billing across all facility feeds</div>
        </div>
        <div className="summary-card info">
          <div className="label">Avg Monthly Revenue</div>
          <div className="value">₹{data.monthly_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="sub">Estimated monthly run-rate</div>
        </div>
        <div className="summary-card success">
          <div className="label">Total Months Ingested</div>
          <div className="value">{data.total_months} Months</div>
          <div className="sub">Timeline block of sales logs</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Category Share Donut Chart */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Product Category Sales Share</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ position: 'relative', width: 140, height: 140 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                {data.categories?.map((cat, idx) => {
                  const percent = (cat.total_qty / totalCategoryQty) * 100;
                  const strokeDash = `${percent} ${100 - percent}`;
                  const strokeOffset = 100 - accumulatedPercent;
                  accumulatedPercent += percent;

                  const colors = ['var(--gold)', 'var(--navy-light)', 'var(--info)', 'var(--success)', '#8b5cf6'];
                  return (
                    <circle
                      key={idx}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={colors[idx % colors.length]}
                      strokeWidth="3.5"
                      strokeDasharray={strokeDash}
                      strokeDashoffset={strokeOffset}
                    />
                  );
                })}
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>100%</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>Sales Qty</div>
              </div>
            </div>

            {/* Donut Legend */}
            <div style={{ flex: 1 }}>
              {data.categories?.map((cat, idx) => {
                const colors = ['var(--gold)', 'var(--primary)', 'var(--info)', 'var(--success)', '#8b5cf6'];
                const percent = ((cat.total_qty / totalCategoryQty) * 100).toFixed(1);
                const categoryName = cat["Item Category"] ? cat["Item Category"].charAt(0).toUpperCase() + cat["Item Category"].slice(1).toLowerCase() : 'Other';
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[idx % colors.length] }} />
                      <span>{categoryName}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{percent}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Store Performance Rankings */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Store Revenue Rankings (Top 5)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.stores?.slice(0, 5).map((store, idx) => {
              const maxRevenue = Math.max(...data.stores.map(s => s.total_revenue));
              const pct = (store.total_revenue / maxRevenue) * 100;
              return (
                <div key={idx} style={{ fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{store["Facility Name"]}</span>
                    <span style={{ color: 'var(--gold-dark)', fontWeight: 700 }}>₹{store.total_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(59,35,123,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--navy-light), var(--gold))', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Deficit Heatmap Matrix Grid */}
      {data.deficit_grid && data.deficit_grid.length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Store-Wise Deficit Intensity Heatmap</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Visualizes stock deficit patterns across top brands and high-deficit stores. Darker cell colors represent higher out-of-stock targets.
          </p>

          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 600 }}>
              {/* Heatmap Grid Layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(5, 1fr)', gap: 4, textAlign: 'center', fontSize: 11 }}>
                {/* Headers */}
                <div />
                {Array.from(new Set(data.deficit_grid.map(g => g.brand))).map((brand, idx) => (
                  <div key={idx} style={{ fontWeight: 700, padding: 8, background: 'rgba(59,35,123,0.03)', borderRadius: 4 }}>
                    {brand}
                  </div>
                ))}

                {/* Rows */}
                {Array.from(new Set(data.deficit_grid.map(g => g.store))).map((store, sIdx) => {
                  const cells = data.deficit_grid.filter(g => g.store === store);
                  return (
                    <div key={sIdx} style={{ display: 'contents' }}>
                      {/* Store name axis label */}
                      <div style={{ textAlign: 'left', fontWeight: 600, padding: '12px 8px', alignSelf: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {store}
                      </div>
                      
                      {cells.map((cell, cIdx) => {
                        const val = cell.deficit;
                        // HSL color calculation for light mode: Red intensity scales with deficit
                        const maxDef = Math.max(...data.deficit_grid.map(g => g.deficit)) || 1;
                        const ratio = val / maxDef;
                        
                        // Scale lightness from 95% down to 45% (light red to deep red)
                        const l = 95 - ratio * 50; 
                        const bg = val > 0 ? `hsl(0, 80%, ${l}%)` : 'rgba(59,35,123,0.03)';
                        const textCol = val === 0 ? 'var(--text-muted)' : (l < 65 ? '#ffffff' : 'var(--text-primary)');
                        
                        return (
                          <div
                            key={cIdx}
                            style={{
                              background: bg,
                              color: textCol,
                              padding: '12px 0',
                              borderRadius: 4,
                              fontWeight: val > 0 ? 700 : 400,
                              border: '1px solid rgba(59,35,123,0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={`Store: ${store} · Brand: ${cell.brand} · Deficit: ${val}`}
                          >
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
