import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssortmentAnalytics } from '../api';

export default function AssortmentPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAssortment = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAssortmentAnalytics();
      if (result.status === 'ready') {
        setData(result);
      }
    } catch (err) {
      console.error('Failed to fetch assortment analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssortment();
  }, [fetchAssortment]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div className="spinner"></div>
        <p style={{ marginTop: 16 }}>Generating assortment and stock diagnostic plots...</p>
      </div>
    );
  }

  if (!data || !data.histogram) {
    return (
      <div>
        <div className="page-header animate-in">
          <h2>Assortment Diagnostics</h2>
          <p>Please upload raw datasets first on the Data Ingestion page.</p>
        </div>
        <div className="empty-state card animate-in">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3>No Diagnostic Data Available</h3>
          <p>Upload stock and run the allocation engine to draw assortment charts.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
            Go to Ingestion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h2>Assortment Diagnostics</h2>
        <p>Advanced cross-source diagnostics: dead stock indicators, substitution flows, and price curves.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Substitution Sankey Cascade Flow */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Substitution Sankey Flow</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Visualizes how warehouse supply gets absorbed through matching paths (Exact, Similar, Fallback) down to store deficits.
          </p>

          <svg viewBox="0 0 500 220" style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: 12 }}>
            {/* Left Node: Corporate Office Supply */}
            <rect x="20" y="50" width="30" height="120" fill="var(--navy-light)" rx="4" />
            <text x="35" y="115" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle" transform="rotate(-90 35 115)">
              WAREHOUSE
            </text>

            {/* Middle Match Nodes */}
            {/* Exact Node */}
            <rect x="220" y="20" width="80" height="30" fill="var(--success)" rx="4" />
            <text x="260" y="38" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle">
              Exact ({data.sankey.exact})
            </text>

            {/* Similar Node */}
            <rect x="220" y="75" width="80" height="30" fill="var(--info)" rx="4" />
            <text x="260" y="93" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle">
              Similar ({data.sankey.similar})
            </text>

            {/* Fallback Node */}
            <rect x="220" y="130" width="80" height="30" fill="var(--warning)" rx="4" />
            <text x="260" y="148" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle">
              Fallback ({data.sankey.fallback})
            </text>

            {/* Unresolved Node */}
            <rect x="220" y="180" width="80" height="30" fill="var(--danger)" rx="4" />
            <text x="260" y="198" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle">
              Stockout ({data.sankey.unresolved})
            </text>

            {/* Right Node: National Store Deficits */}
            <rect x="450" y="50" width="30" height="120" fill="var(--gold)" rx="4" />
            <text x="465" y="115" fill="var(--navy-dark)" fontSize="10" fontWeight="700" textAnchor="middle" transform="rotate(90 465 115)">
              STORES
            </text>

            {/* Flow Paths (Bezier Curves) */}
            {/* Warehouse -> Exact */}
            <path d="M 50 80 C 130 80, 130 35, 220 35" stroke="var(--success)" strokeWidth="4" fill="transparent" opacity="0.3" />
            {/* Warehouse -> Similar */}
            <path d="M 50 110 C 130 110, 130 90, 220 90" stroke="var(--info)" strokeWidth="4" fill="transparent" opacity="0.3" />
            {/* Warehouse -> Fallback */}
            <path d="M 50 140 C 130 140, 130 145, 220 145" stroke="var(--warning)" strokeWidth="4" fill="transparent" opacity="0.3" />

            {/* Match Nodes -> Stores */}
            <path d="M 300 35 C 380 35, 380 80, 450 80" stroke="var(--success)" strokeWidth="4" fill="transparent" opacity="0.3" />
            <path d="M 300 90 C 380 90, 380 110, 450 110" stroke="var(--info)" strokeWidth="4" fill="transparent" opacity="0.3" />
            <path d="M 300 145 C 380 145, 380 140, 450 140" stroke="var(--warning)" strokeWidth="4" fill="transparent" opacity="0.3" />
            <path d="M 300 195 C 380 195, 380 160, 450 160" stroke="var(--danger)" strokeWidth="4" fill="transparent" opacity="0.3" />
          </svg>
        </div>

        {/* Weeks-of-Cover Diagnostic */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Weeks of Cover per Store Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {data.cover?.map((c, idx) => (
              <div key={idx} style={{ fontSize: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>Category {c.category} Stores</span>
                  <span style={{ color: c.weeks < 2 ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                    {c.weeks} Weeks Cover
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(59,35,123,0.05)', borderRadius: 3 }}>
                  <div
                    style={{
                      width: `${Math.min(100, (c.weeks / 8) * 100)}%`,
                      height: '100%',
                      background: c.weeks < 2 ? 'var(--danger)' : 'var(--success)',
                      borderRadius: 3
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Dead Stock Scatter Plot */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Dead Stock Diagnostic Scatter</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Matches stock SOH (X axis) against Monthly Sales velocity (Y axis). High stock + zero sales indicates rotting stock.
          </p>

          <svg viewBox="0 0 300 200" style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: 8, padding: 12 }}>
            <line x1="30" y1="10" x2="30" y2="170" stroke="rgba(59,35,123,0.1)" strokeWidth="1" />
            <line x1="30" y1="170" x2="290" y2="170" stroke="rgba(59,35,123,0.1)" strokeWidth="1" />

            <text x="10" y="90" fill="var(--text-secondary)" fontSize="7" transform="rotate(-90 10 90)" textAnchor="middle">
              Sales Velocity (Qty)
            </text>
            <text x="160" y="185" fill="var(--text-secondary)" fontSize="7" textAnchor="middle">
              Current Store SOH (Units)
            </text>

            {/* Plot Points */}
            {data.scatter?.map((pt, idx) => {
              const maxSoh = Math.max(...data.scatter.map(p => p.soh)) || 1;
              const maxSales = Math.max(...data.scatter.map(p => p.sales)) || 1;

              const cx = 30 + (pt.soh / maxSoh) * 240;
              const cy = 170 - (pt.sales / maxSales) * 150;

              const colors = {
                'Dead Stock': 'var(--danger)',
                'Stockout Risk': 'var(--warning)',
                'Healthy': 'var(--success)'
              };

              return (
                <circle
                  key={idx}
                  cx={cx}
                  cy={cy}
                  r="3.5"
                  fill={colors[pt.status]}
                  opacity="0.8"
                  title={`SKU: ${pt.sku} · SOH: ${pt.soh} · Sales: ${pt.sales}`}
                />
              );
            })}
          </svg>
          <div style={{ display: 'flex', gap: 16, marginTop: 12, justifyContent: 'center', fontSize: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Dead Stock</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--warning)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Stockout Risk</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Healthy</span>
            </div>
          </div>
        </div>

        {/* Price Histogram */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Catalog Price Band Distribution</h3>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Buckets entire stock catalog by retail pricing (MRP). Highlights where inventory value is concentrated.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.histogram?.map((h, idx) => {
              const maxHist = Math.max(...data.histogram.map(item => item.count)) || 1;
              const pct = (h.count / maxHist) * 100;
              return (
                <div key={idx} style={{ fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600 }}>{h.bucket}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{h.count.toLocaleString()} SKUs</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(59,35,123,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
