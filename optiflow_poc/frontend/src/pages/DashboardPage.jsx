import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function CollapsibleRow({ node, depth = 0, forceExpandAll }) {
  const [expanded, setExpanded] = useState(false); // All zones collapsed by default

  const isExpanded = forceExpandAll || expanded;
  const isLeaf = Array.isArray(node.items) && node.items.length > 0 && !node.items[0].items;

  const getLabel = () => {
    if (node.level === 'zone') return 'ZONE: ' + node.name;
    if (node.level === 'region') return 'REGION: ' + node.name;
    if (node.level === 'store_category') return 'GRADE: ' + node.name;
    if (node.level === 'store_name') return 'STORE: ' + node.name;
    if (node.level === 'brand_name') return 'BRAND: ' + node.name;
    return node.name;
  };

  const fillPct = node.summary.deficit > 0 
    ? Math.round((node.summary.allocated / node.summary.deficit) * 100) 
    : 100;

  // Distinct background colors for each hierarchy level to make it very easy to read
  const getBackground = () => {
    if (depth === 0) return 'rgba(59,35,123,0.06)'; // Zone (Primary tinted)
    if (depth === 1) return 'rgba(59,35,123,0.03)'; // Region
    if (depth === 2) return 'rgba(46,204,113,0.05)'; // Grade (Success tinted)
    if (depth === 3) return 'rgba(241,196,15,0.05)'; // Store (Warning tinted)
    return 'transparent'; // Brand
  };

  return (
    <>
      <tr 
        onClick={() => setExpanded(!isExpanded)}
        style={{ 
          cursor: 'pointer',
          background: getBackground(),
          borderBottom: depth === 0 ? '2px solid var(--border)' : '1px solid var(--border)'
        }}
        className={isLeaf ? '' : 'hover-row'}
      >
        <td style={{ paddingLeft: 16 + (depth * 24), fontWeight: depth < 2 ? 700 : 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, width: 16, display: 'inline-block' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
            <span style={{ 
              textTransform: depth === 0 ? 'uppercase' : 'none', 
              letterSpacing: depth === 0 ? 0.5 : 0 
            }}>
              {getLabel()}
            </span>
          </div>
        </td>
        <td style={{ textAlign: 'right' }}>{node.summary.soh.toLocaleString()}</td>
        <td style={{ textAlign: 'right', fontWeight: 600 }}>{node.summary.deficit.toLocaleString()}</td>
        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>{node.summary.allocated.toLocaleString()}</td>
        <td style={{ textAlign: 'right', color: node.summary.outOfStock > 0 ? 'var(--danger)' : 'inherit', fontWeight: node.summary.outOfStock > 0 ? 600 : 400 }}>
          {node.summary.outOfStock.toLocaleString()}
        </td>
        <td style={{ width: 100, textAlign: 'right', fontWeight: 600 }}>
          {fillPct}%
        </td>
      </tr>
      
      {isExpanded && !isLeaf && node.items.map((child, idx) => (
        <CollapsibleRow key={idx} node={child} depth={depth + 1} forceExpandAll={forceExpandAll} />
      ))}

      {isExpanded && isLeaf && (
        <tr>
          <td colSpan={6} style={{ padding: 0 }}>
            <div style={{ padding: '0px 16px 16px ' + (16 + (depth + 1) * 24) + 'px', background: 'var(--bg-app)', borderBottom: '2px solid var(--border)' }} className="print-no-padding">
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', borderTop: 'none' }} className="table-container">
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <tr style={{ color: 'var(--text-secondary)' }}>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Target SKU</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Allocated SKU</th>
                      <th style={{ textAlign: 'right', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Amount Allocated</th>
                      <th style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Match Type</th>
                      <th style={{ textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>Reasoning</th>
                    </tr>
                  </thead>
                  <tbody>
                    {node.items.map((item, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{item.requested_item_code || "N/A"}</td>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{item.allocated_item_code || "N/A"}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{item.allocated_qty}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                            background: item.match_type === 'exact' ? 'rgba(46,204,113,0.15)' : item.match_type === 'similar' ? 'rgba(52,152,219,0.15)' : 'rgba(241,196,15,0.15)',
                            color: item.match_type === 'exact' ? 'var(--success)' : item.match_type === 'similar' ? 'var(--primary)' : 'var(--warning-dark)'
                          }}>
                            {item.match_type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{item.match_reason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}


export default function DashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [forceExpandAll, setForceExpandAll] = useState(false);

  const [filters, setFilters] = useState({
    zone: '',
    region: '',
    store_category: '',
    store_name: '',
    brand_name: '',
    commodity: ''
  });

  const [metadata, setMetadata] = useState({
    zones: [], regions: [], categories: [], stores: [], brands: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ ...filters, page_size: 50000 });
      const res = await fetch(`https://optiflow-backend-977593391877.us-central1.run.app/api/allocation/results?${q}`);
      const json = await res.json();
      
      if (!res.ok) {
        if (res.status === 404) setData([]);
        return;
      }
      
      setData(json.allocations || []);
      setTotal(json.total || 0);

      if (metadata.zones.length === 0 && json.allocations.length > 0) {
        const unique = (key) => [...new Set(json.allocations.map(a => a[key]).filter(Boolean))].sort();
        setMetadata({
          zones: unique('zone'),
          regions: unique('region'),
          categories: ['A++', 'A+', 'A', 'B+', 'B', 'C'],
          stores: unique('store_name'),
          brands: unique('brand_name')
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    if (!loading && sessionStorage.getItem('pending_print_full') === 'true') {
      sessionStorage.removeItem('pending_print_full');
      setForceExpandAll(true);
      setTimeout(() => {
        window.print();
        setForceExpandAll(false);
      }, 500);
    }
  }, [loading]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
  };

  const handlePrint = (full) => {
    setPrintMenuOpen(false);
    if (full) {
      setFilters({ zone: '', region: '', store_category: '', store_name: '', brand_name: '', commodity: '' });
      sessionStorage.setItem('pending_print_full', 'true');
    } else {
      setForceExpandAll(true);
      setTimeout(() => {
        window.print();
        setForceExpandAll(false);
      }, 500);
    }
  };

  const handleDownloadCsv = (full) => {
    setExportMenuOpen(false);
    if (full) {
      window.open(`https://optiflow-backend-977593391877.us-central1.run.app/api/allocation/results/export?group_by=zone`, '_blank');
    } else {
      window.open(`https://optiflow-backend-977593391877.us-central1.run.app/api/allocation/results/export?group_by=zone&${new URLSearchParams(filters)}`, '_blank');
    }
  };

  const treeData = useMemo(() => {
    if (!data.length) return [];

    const summarize = (items) => {
      const uniqueGapsMap = {};
      const uniqueSohMap = {};
      items.forEach(i => { 
        uniqueGapsMap[i.gap_id] = i.deficit; 
        uniqueSohMap[i.gap_id] = i.current_soh;
      });
      const deficit = Object.values(uniqueGapsMap).reduce((a, b) => a + b, 0);
      const soh = Object.values(uniqueSohMap).reduce((a, b) => a + b, 0);
      const allocated = items.reduce((a, b) => a + b.allocated_qty, 0);
      const outOfStock = Math.max(0, deficit - allocated);
      return { soh, deficit, allocated, outOfStock };
    };

    const buildTree = (items, keys) => {
      if (keys.length === 0) return items;
      const key = keys[0];
      
      const grouped = items.reduce((acc, item) => {
        const val = item[key] || `Unassigned ${key}`;
        if (!acc[val]) acc[val] = [];
        acc[val].push(item);
        return acc;
      }, {});
      
      return Object.keys(grouped).sort().map(k => ({
        name: k,
        level: key,
        summary: summarize(grouped[k]),
        items: buildTree(grouped[k], keys.slice(1))
      }));
    };

    return buildTree(data, ['zone', 'region', 'store_category', 'store_name', 'brand_name']);
  }, [data]);

  if (loading && data.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading Report...</div>;
  }

  if (data.length === 0 && !Object.values(filters).some(v => v !== '')) {
    return (
      <div style={{ padding: 40, textAlign: 'center', marginTop: 100 }}>
        <div className="card animate-in" style={{ display: 'inline-block', padding: 40 }}>
          <h3 style={{ marginBottom: 10 }}>No Allocation Data</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Upload planograms and live stock to generate recommendations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container" onClick={() => { setPrintMenuOpen(false); setExportMenuOpen(false); }}>
      
      {/* OFFICIAL PRINT HEADER (ONLY VISIBLE ON PRINT) */}
      <div className="print-only" style={{ marginBottom: 30, paddingBottom: 20, borderBottom: '2px solid #000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Center For Sight</h1>
            <h3 style={{ margin: 0, fontSize: 16, color: '#444', fontWeight: 500 }}>OptiFlow - Heuristic Allocation System</h3>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>GENERATED ON: {new Date().toLocaleString()}</p>
          </div>
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>
          <strong>Report Filters:</strong> {Object.entries(filters).filter(([k,v]) => v).map(([k,v]) => `${k.toUpperCase()}: ${v}`).join(' | ') || 'FULL REPORT (UNFILTERED)'}
        </p>
      </div>

      <div className="page-header animate-in print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 9999 }}>
        <h2>Allocation Report</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          
          {/* PRINT DROPDOWN */}
          <div style={{ position: 'relative', zIndex: 9999 }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost" onClick={() => { setPrintMenuOpen(!printMenuOpen); setExportMenuOpen(false); }}>
              Print Report ▼
            </button>
            {printMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999, minWidth: 180, marginTop: 4, overflow: 'hidden' }}>
                <div 
                  onClick={() => handlePrint(false)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500 }}
                  className="hover-row"
                >
                  Print Filtered Report
                </div>
                <div 
                  onClick={() => handlePrint(true)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
                  className="hover-row"
                >
                  Print Full Master
                </div>
              </div>
            )}
          </div>

          {/* EXPORT DROPDOWN */}
          <div style={{ position: 'relative', zIndex: 9999 }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-primary" onClick={() => { setExportMenuOpen(!exportMenuOpen); setPrintMenuOpen(false); }}>
              Download Excel ▼
            </button>
            {exportMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999, minWidth: 180, marginTop: 4, overflow: 'hidden' }}>
                <div 
                  onClick={() => handleDownloadCsv(false)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Download Filtered Excel
                </div>
                <div 
                  onClick={() => handleDownloadCsv(true)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Download Full Master Excel
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card animate-in" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px' }} className="print-no-padding">
          
          {/* FILTERS */}
          <div className="print-hide" style={{ background: 'var(--bg-app)', padding: '24px', borderRadius: 16, border: '1px solid var(--border)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <h3 style={{ margin: 0, fontSize: 18 }}>Filters</h3>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {total.toLocaleString()} rows found
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ zone: '', store_category: '', region: '', store_name: '', brand_name: '', commodity: '' })} style={{ fontSize: 14, color: 'var(--danger)' }}>
                  Reset Filters
                </button>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Zone</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px', borderRadius: 6, fontSize: 14 }} value={filters.zone} onChange={(e) => handleFilterChange('zone', e.target.value)}>
                  <option value="">All Zones</option>
                  {metadata.zones.map((z, i) => <option key={i} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Region</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px', borderRadius: 6, fontSize: 14 }} value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}>
                  <option value="">All Regions</option>
                  {metadata.regions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Store Grade</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px', borderRadius: 6, fontSize: 14 }} value={filters.store_category} onChange={(e) => handleFilterChange('store_category', e.target.value)}>
                  <option value="">All Grades</option>
                  {metadata.categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Store Name</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px', borderRadius: 6, fontSize: 14 }} value={filters.store_name} onChange={(e) => handleFilterChange('store_name', e.target.value)}>
                  <option value="">All Stores</option>
                  {metadata.stores.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Brand</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px', borderRadius: 6, fontSize: 14 }} value={filters.brand_name} onChange={(e) => handleFilterChange('brand_name', e.target.value)}>
                  <option value="">All Brands</option>
                  {metadata.brands.map((b, i) => <option key={i} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Category</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px', borderRadius: 6, fontSize: 14 }} value={filters.commodity} onChange={(e) => handleFilterChange('commodity', e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="Frame">Frames</option>
                  <option value="Sunglass">Sunglasses</option>
                </select>
              </div>
            </div>
          </div>

          {/* HIERARCHICAL TREE GRID */}
          <div className="table-container print-full-width" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
            <table className="data-table" style={{ margin: 0, width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th style={{ paddingLeft: 24, fontSize: 11, letterSpacing: 0.5 }}></th>
                  <th style={{ textAlign: 'right', fontSize: 11, letterSpacing: 0.5 }}>STOCK IN HAND</th>
                  <th style={{ textAlign: 'right', fontSize: 11, letterSpacing: 0.5 }}>PLANOGRAM DEFICIT</th>
                  <th style={{ textAlign: 'right', fontSize: 11, letterSpacing: 0.5 }}>FULFILLED STOCK</th>
                  <th style={{ textAlign: 'right', fontSize: 11, letterSpacing: 0.5 }}>OUT OF STOCK</th>
                  <th style={{ textAlign: 'right', width: 100, fontSize: 11, letterSpacing: 0.5 }}>FULFILLMENT %</th>
                </tr>
              </thead>
              <tbody>
                {treeData.map((node, idx) => (
                  <CollapsibleRow key={idx} node={node} forceExpandAll={forceExpandAll} />
                ))}
                {treeData.length === 0 && !loading && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                      No results found for these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
