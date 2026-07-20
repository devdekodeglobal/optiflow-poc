import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBrandDetail } from '../api';

export default function BrandPage() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawExpanded, setRawExpanded] = useState(false);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBrandDetail(brandName);
      setDetail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [brandName]);

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
          <h2 style={{ color: 'var(--danger)', marginBottom: 12 }}>Error Loading Brand</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error || 'Brand not found'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 24 }}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-content">
      <div className="header-actions animate-in">
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard')} style={{ marginBottom: 12, display: 'inline-flex', padding: 0 }}>
            ← Back to Allotment Dashboard
          </button>
          <h1>
            {detail.brand_name}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/api/allocation/download/by-brand`, '_blank')}>
            ⬇ Download Master CSV
          </button>
        </div>
      </div>

      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="summary-card navy animate-in">
          <div className="label">Fulfillment</div>
          <div className="value">{detail.fulfillment_pct}%</div>
          <div className="sub">{detail.total_filled.toLocaleString()} of {detail.total_deficit.toLocaleString()} units filled</div>
        </div>
        <div className="summary-card gold animate-in">
          <div className="label">Retail Value Moved</div>
          <div className="value">₹{(detail.total_retail_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div className="sub">Total MRP allocated</div>
        </div>
        <div className="summary-card success animate-in">
          <div className="label">SOH at Time of Run</div>
          <div className="value">{detail.total_soh.toLocaleString()}</div>
          <div className="sub">Current stock on hand</div>
        </div>
        <div className="summary-card warning animate-in">
          <div className="label">Unresolved</div>
          <div className="value">{detail.total_unresolved.toLocaleString()}</div>
          <div className="sub">Units left out of stock</div>
        </div>
        <div className="summary-card info animate-in">
          <div className="label">Match Accuracy</div>
          <div className="value">{detail.match_accuracy_pct}%</div>
          <div className="sub">Exact matches</div>
        </div>
      </div>

      <div className="card animate-in" style={{ marginTop: 24, padding: 24 }}>
        <h3 style={{ marginBottom: 16 }}>Fulfillment Progress</h3>
        <div style={{ height: 24, background: 'var(--bg-app)', borderRadius: 12, overflow: 'hidden', display: 'flex', border: '1px solid var(--border)' }}>
          <div style={{ width: `${detail.fulfillment_pct}%`, background: 'var(--primary)', height: '100%', transition: 'width 1s ease-in-out' }} />
          <div style={{ width: `${100 - detail.fulfillment_pct}%`, background: 'var(--danger)', height: '100%', opacity: 0.2 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
          <span>Filled: {detail.total_filled}</span>
          <span>Deficit: {detail.total_deficit}</span>
        </div>
      </div>


      <div className="card animate-in" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <h3 style={{ margin: 0 }}>Store Breakdown</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Store</th>
                <th>Deficit</th>
                <th>Filled</th>
                <th>Fulfill %</th>
                <th>Out of Stock</th>
                <th>Exact</th>
                <th>Similar</th>
                <th>Fallback</th>
                <th>Retail Value</th>
              </tr>
            </thead>
            <tbody>
              {detail.stores.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700 }}>{s.store_name}</td>
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
            <h3 style={{ margin: 0 }}>View Raw Allocations</h3>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {detail.stores.reduce((sum, s) => sum + s.items.length, 0)} lines
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
                {detail.stores.map(s => s.items.map((row, idx) => (
                  <tr key={`${s.store_name}-${idx}`} className={row.color_limit_warning ? 'warning-row' : ''}>
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
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
