import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSalesAnalytics } from '../api';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [salesAnalytics, setSalesAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSalesData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSalesAnalytics();
      if (data.status === 'ready') {
        setSalesAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch sales analytics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div className="spinner"></div>
        <p style={{ marginTop: 16 }}>Analyzing sales transactions...</p>
      </div>
    );
  }

  if (!salesAnalytics) {
    return (
      <div>
        <div className="page-header animate-in">
          <h2>Predictive Demand Analytics</h2>
          <p>Please upload Sales Data CSV in the Data Ingestion page first.</p>
        </div>
        <div className="empty-state card">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3>No Sales Data Found</h3>
          <p>Upload the Sales Data CSV to see predictive demand velocity graphs.</p>
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
        <h2>Predictive Demand Analytics</h2>
        <p>Sales velocity tracking and 30-day projected demand based on raw transaction logs.</p>
      </div>

      {/* KPI Cards */}
      <div className="summary-grid" style={{ marginBottom: 24 }}>
        <div className="summary-card navy">
          <div className="label">Gross Sales Revenue (6 Months Total)</div>
          <div className="value">₹{salesAnalytics.total_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="sub">Total gross revenue from sales log</div>
        </div>
        <div className="summary-card info">
          <div className="label">Avg Monthly Revenue</div>
          <div className="value">₹{salesAnalytics.monthly_revenue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="sub">Estimated monthly run-rate</div>
        </div>
        <div className="summary-card gold">
          <div className="label">Primary Brands</div>
          <div className="value">{salesAnalytics.brands?.length || 0}</div>
          <div className="sub">Tracked in transaction logs</div>
        </div>
        <div className="summary-card success">
          <div className="label">Target Growth Rate</div>
          <div className="value">+15%</div>
          <div className="sub">Baseline monthly growth factor</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, alignItems: 'stretch' }}>
        {/* Graph Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Demand Velocity Visualization</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <svg viewBox="0 0 500 240" style={{ width: '100%', height: 'auto', background: 'rgba(59, 35, 123, 0.02)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
              {/* Grid Lines */}
              <line x1="40" y1="40" x2="480" y2="40" stroke="rgba(59,35,123,0.1)" strokeWidth="1" />
              <line x1="40" y1="90" x2="480" y2="90" stroke="rgba(59,35,123,0.1)" strokeWidth="1" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="rgba(59,35,123,0.1)" strokeWidth="1" />
              <line x1="40" y1="190" x2="480" y2="190" stroke="rgba(59,35,123,0.2)" strokeWidth="1" />

              {/* Bars */}
              {salesAnalytics.brands.slice(0, 5).map((item, idx) => {
                const x = 60 + idx * 85;
                const maxVal = Math.max(...salesAnalytics.brands.map(b => b.predicted_demand_30d));
                const scale = 140 / (maxVal || 1);
                
                const actualHeight = item.total_qty * scale;
                const predictedHeight = item.predicted_demand_30d * scale;

                return (
                  <g key={idx}>
                    <rect
                      x={x}
                      y={190 - actualHeight}
                      width="18"
                      height={actualHeight}
                      fill="var(--navy-light)"
                      rx="2"
                    />
                    <rect
                      x={x + 22}
                      y={190 - predictedHeight}
                      width="18"
                      height={predictedHeight}
                      fill="var(--gold)"
                      rx="2"
                    />
                    <text x={x + 20} y="210" fill="var(--text-secondary)" fontSize="9" textAnchor="middle" fontWeight="600">
                      {item.brand}
                    </text>
                  </g>
                );
              })}

              {/* Legend */}
              <rect x="320" y="10" width="10" height="10" fill="var(--navy-light)" rx="2" />
              <text x="336" y="18" fill="var(--text-secondary)" fontSize="10">Actual Sales Velocity</text>

              <rect x="320" y="25" width="10" height="10" fill="var(--gold)" rx="2" />
              <text x="336" y="33" fill="var(--text-secondary)" fontSize="10">Predicted 30D Demand</text>
            </svg>
          </div>
        </div>

        {/* Data list card */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Performance Table</h3>
          <div className="table-container" style={{ background: 'transparent', border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th style={{ textAlign: 'right' }}>Actual Qty</th>
                  <th style={{ textAlign: 'right' }}>Forecast Demand</th>
                </tr>
              </thead>
              <tbody>
                {salesAnalytics.brands.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{item.brand}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>{item.total_qty.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: 'var(--gold-dark)', fontWeight: 700 }}>
                      {item.predicted_demand_30d.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
