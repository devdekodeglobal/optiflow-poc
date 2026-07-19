import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRegionDetail } from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';

export default function RegionPage() {
  const { regionName } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawExpanded, setRawExpanded] = useState(false);
  const [visibleLines, setVisibleLines] = useState(100);
  const [selectedTier, setSelectedTier] = useState('All');

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRegionDetail(regionName);
      setDetail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [regionName]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const matchBadge = (type) => {
    const map = {
      exact: { label: 'EXACT', className: 'badge-exact' },
      similar: { label: 'SIMILAR', className: 'badge-similar' },
      substitute: { label: 'FALLBACK', className: 'badge-substitute' },
      unresolved: { label: 'UNRESOLVED', className: 'badge-unresolved' },
    };
    const info = map[type] || map.unresolved;
    return <span className={`badge ${info.className}`}>{info.label}</span>;
  };

  const renderAttributes = (row) => {
    if (!row.allocated_item_code) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
    if (row.match_type === 'exact') return <span style={{ color: 'var(--success)', fontWeight: 600 }}>Exact Match</span>;
    
    const attrs = row.allocated_attributes;
    return (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', fontSize: 11 }}>
        {attrs.color && <span style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{attrs.color}</span>}
        {attrs.shape && <span style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{attrs.shape}</span>}
        {attrs.frametype && <span style={{ background: 'var(--bg-surface)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{attrs.frametype}</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="layout-content flex-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="layout-content flex-center">
        <div className="card text-center" style={{ padding: 40, maxWidth: 400 }}>
          <h2 style={{ color: 'var(--danger)', marginBottom: 12 }}>Error Loading Region</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error || 'Region not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 24 }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const availableTiers = detail ? ['All', ...new Set(detail.stores.map(s => s.store_category).filter(Boolean))].sort((a, b) => {
    const order = { 'All': 0, 'A++': 1, 'A+': 2, 'A': 3, 'B+': 4, 'B': 5, 'C': 6 };
    return (order[a] || 99) - (order[b] || 99);
  }) : [];

  const filteredStores = detail ? (selectedTier === 'All' ? detail.stores : detail.stores.filter(s => s.store_category === selectedTier)) : [];

  return (
    <div className="layout-content">
      <div className="header-actions animate-in">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 12, display: 'inline-flex', padding: 0 }}>
            ← Back to Allotment Dashboard
          </button>
          <h1>
            {detail.region_name} Region
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => window.open(`http://localhost:8000/api/allocation/download/region/${encodeURIComponent(detail.region_name)}`, '_blank')}>
            ⬇ Download Region CSV
          </button>
        </div>
      </div>

      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="summary-card navy animate-in">
          <div className="label">Fulfillment</div>
          <div className="value">{detail.fulfillment_pct}%</div>
          <div className="sub">{detail.total_filled.toLocaleString()} of {detail.total_deficit.toLocaleString()} units sent</div>
        </div>
        <div className="summary-card gold animate-in">
          <div className="label">Retail Value Moved</div>
          <div className="value">₹{(detail.total_retail_value / 100000).toFixed(1)}L</div>
          <div className="sub">Potential revenue unlocked</div>
        </div>
        <div className="summary-card danger animate-in">
          <div className="label">Still Out of Stock</div>
          <div className="value">{detail.unresolved_lines}</div>
          <div className="sub">No stock available</div>
        </div>
        <div className="summary-card info animate-in">
          <div className="label">Perfect Matches</div>
          <div className="value">{detail.match_accuracy_pct}%</div>
          <div className="sub">Exact matches</div>
        </div>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 24 }}>
        <div className="card animate-in" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Fulfillment Overview</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Stock Sent', value: detail.total_filled, color: 'var(--primary)' },
                    { name: 'Still Needed', value: Math.max(0, detail.total_deficit - detail.total_filled), color: 'var(--danger)' }
                  ].filter(d => d.value > 0)} 
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="75%" paddingAngle={5}
                >
                  {[
                    { name: 'Stock Sent', value: detail.total_filled, color: 'var(--primary)' },
                    { name: 'Still Needed', value: Math.max(0, detail.total_deficit - detail.total_filled), color: 'var(--danger)' }
                  ].filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `${value.toLocaleString()} units`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-in" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Match Quality</h3>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    { name: 'Exact', value: detail.exact_matches || 0, color: 'var(--success)' },
                    { name: 'Similar', value: detail.similar_matches || 0, color: 'var(--primary)' },
                    { name: 'Fallback', value: detail.brand_fallbacks || 0, color: 'var(--warning-dark)' },
                    { name: 'Unresolved', value: detail.unresolved_lines || 0, color: 'var(--danger)' },
                  ].filter(d => d.value > 0)} 
                  dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="75%" paddingAngle={5}
                >
                  {[
                    { name: 'Exact', value: detail.exact_matches || 0, color: 'var(--success)' },
                    { name: 'Similar', value: detail.similar_matches || 0, color: 'var(--primary)' },
                    { name: 'Fallback', value: detail.brand_fallbacks || 0, color: 'var(--warning-dark)' },
                    { name: 'Unresolved', value: detail.unresolved_lines || 0, color: 'var(--danger)' },
                  ].filter(d => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value) => `${value.toLocaleString()} lines`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-in" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 16 }}>Store Performance</h3>
          <div style={{ height: 400, overflowY: 'auto', overflowX: 'hidden', paddingRight: 8 }}>
            <div style={{ height: Math.max(300, filteredStores.length * 40) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={[...filteredStores].sort((a, b) => b.deficit - a.deficit).map(s => ({
                    name: s.store_name,
                    filled: s.filled,
                    out_of_stock: s.out_of_stock
                  }))} 
                  layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 600 }} width={120} />
                  <RechartsTooltip cursor={{fill: 'var(--bg-app)'}} formatter={(value) => `${value.toLocaleString()} units`} />
                  <Legend />
                  <Bar dataKey="filled" stackId="a" fill="var(--primary)" name="Filled Units" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="out_of_stock" stackId="a" fill="var(--danger)" name="Out of Stock" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>


      <div className="card animate-in" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <h3 style={{ margin: 0 }}>Store Details</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableTiers.map(tier => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`btn btn-sm ${selectedTier === tier ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ borderRadius: 20 }}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Store Map Grid */}
        <div style={{ padding: '0 24px 24px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {filteredStores.map((s, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: 16, 
                  background: 'var(--bg-app)', 
                  borderRadius: 8, 
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
                onClick={() => navigate(`/store/${encodeURIComponent(s.store_name)}`)}
              >
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {s.store_name}
                  {s.store_category && (
                    <span style={{ marginLeft: 6, padding: '2px 6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 10, color: 'var(--text-secondary)' }}>
                      {s.store_category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Items Needed</th>
                <th>Stock Sent</th>
                <th>Fulfill %</th>
                <th>Still Short</th>
                <th>Exact</th>
                <th>Similar</th>
                <th>Alternative</th>
                <th>Retail Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700 }}>
                    {s.store_name}
                    {s.store_category && (
                      <span style={{ marginLeft: 8, padding: '2px 6px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 10, color: 'var(--text-secondary)' }}>
                        {s.store_category}
                      </span>
                    )}
                  </td>
                  <td>{s.deficit}</td>
                  <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{s.filled}</td>
                  <td>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: 12, 
                      fontSize: 12, 
                      fontWeight: 700,
                      background: s.fulfillment_pct === 100 ? 'rgba(46, 204, 113, 0.15)' : 
                                  s.fulfillment_pct > 50 ? 'rgba(241, 196, 15, 0.15)' : 'rgba(231, 76, 60, 0.15)',
                      color: s.fulfillment_pct === 100 ? 'var(--success)' : 
                             s.fulfillment_pct > 50 ? 'var(--warning-dark)' : 'var(--danger)'
                    }}>
                      {s.fulfillment_pct}%
                    </span>
                  </td>
                  <td style={{ color: s.out_of_stock > 0 ? 'var(--danger)' : 'inherit', fontWeight: s.out_of_stock > 0 ? 600 : 400 }}>
                    {s.out_of_stock}
                  </td>
                  <td>{s.exact_lines}</td>
                  <td>{s.similar_lines}</td>
                  <td>{s.fallback_lines > 0 ? <span style={{color: 'var(--danger)', fontWeight: 600}}>{s.fallback_lines}</span> : s.fallback_lines}</td>
                  <td style={{ fontFamily: 'monospace' }}>₹{s.retail_value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card animate-in" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div 
          onClick={() => setRawExpanded(!rawExpanded)}
          style={{ 
            padding: '20px 24px', 
            background: rawExpanded ? 'rgba(59,35,123,0.02)' : 'var(--bg-surface)',
            borderBottom: rawExpanded ? '1px solid var(--border)' : 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, color: 'var(--text-muted)', width: 20 }}>
              {rawExpanded ? '−' : '+'}
            </span>
            <h3 style={{ margin: 0 }}>Detailed Allocation Breakdown</h3>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {filteredStores.reduce((sum, s) => sum + s.items.length, 0)} lines
          </div>
        </div>

        {rawExpanded && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Store</th>
                  <th>Gaps</th>
                  <th>Target SKU</th>
                  <th>Allocated SKU</th>
                  <th>Qty</th>
                  <th>Similarity Attributes</th>
                  <th>Match Type</th>
                  <th>Reasoning / Warnings</th>
                </tr>
              </thead>
              <tbody>
                {filteredStores.flatMap(s => s.items).slice(0, visibleLines).map((row, idx) => (
                  <tr key={`${row.store_name}-${idx}`} className={row.color_limit_warning ? 'warning-row' : ''}>
                    <td>{row.store_name}</td>
                    <td>{row.deficit}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{row.requested_item_code || '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      <span style={{ background: 'rgba(214, 168, 0, 0.12)', color: 'var(--gold-dark)', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                        {row.allocated_item_code || '—'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{row.allocated_qty || '—'}</td>
                    <td>{renderAttributes(row)}</td>
                    <td>{matchBadge(row.match_type)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {row.color_limit_warning && (
                        <span style={{ color: 'var(--danger)', fontWeight: 600, marginRight: 8 }}>
                          ⚠️ Max 2 colors limit reached!
                        </span>
                      )}
                      {row.match_reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {visibleLines < filteredStores.reduce((sum, s) => sum + s.items.length, 0) && (
              <div style={{ padding: 24, textAlign: 'center', borderTop: '1px solid var(--border)' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setVisibleLines(v => v + 100)}
                >
                  Load Next 100 Lines
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
