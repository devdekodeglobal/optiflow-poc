import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function CollapsibleRow({ node, depth = 0, forceExpandAll }) {
  const [expanded, setExpanded] = useState(false);

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

  const getBackground = () => {
    if (depth === 0) return 'rgba(59,35,123,0.06)';
    if (depth === 1) return 'rgba(59,35,123,0.03)';
    if (depth === 2) return 'rgba(46,204,113,0.05)';
    if (depth === 3) return 'rgba(241,196,15,0.05)';
    return 'transparent';
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
        <td colSpan={2} style={{ paddingLeft: 16 + (depth * 24), fontWeight: depth < 2 ? 700 : 500 }}>
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
        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)' }}>
          {node.summary.allocated.toLocaleString()} Items to Pick
        </td>
      </tr>
      
      {isExpanded && !isLeaf && node.items.map((child, idx) => (
        <CollapsibleRow key={idx} node={child} depth={depth + 1} forceExpandAll={forceExpandAll} />
      ))}

      {isExpanded && isLeaf && (
        <tr>
          <td colSpan={3} style={{ padding: 0 }}>
            <div style={{ padding: '0px 16px 16px ' + (16 + (depth + 1) * 24) + 'px', background: 'var(--bg-app)', borderBottom: '2px solid var(--border)' }} className="print-no-padding">
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '0 0 8px 8px', borderTop: 'none' }} className="table-container">
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <tr style={{ color: 'var(--primary-dark)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Allocated SKU</th>
                      <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Item Description</th>
                      <th style={{ textAlign: 'center', padding: '10px 12px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Store / Brand</th>
                      <th style={{ textAlign: 'right', padding: '10px 12px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Dispatch Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {node.items.map((item, idx) => (
                      <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontWeight: 700 }}>
                          <span style={{ background: 'rgba(214, 168, 0, 0.12)', color: 'var(--gold-dark)', padding: '4px 8px', borderRadius: 6 }}>
                            {item.allocated_item_code || "N/A"}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 500, fontSize: 14 }}>{item.allocated_item_name || "N/A"}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 600 }}>{item.store_name}</div>
                          <div style={{ color: 'var(--text-secondary)' }}>{item.brand_name}</div>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>{item.allocated_qty}</td>
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

export default function DispatchPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [forceExpandAll, setForceExpandAll] = useState(false);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  
  const searchParams = new URLSearchParams(window.location.search);
  
  const [filters, setFilters] = useState({
    zone: searchParams.get('zone') || '',
    region: searchParams.get('region') || '',
    store_category: searchParams.get('store_category') || '',
    store_name: searchParams.get('store_name') || '',
    brand_name: searchParams.get('brand_name') || '',
    commodity: searchParams.get('commodity') || ''
  });

  const [metadata, setMetadata] = useState({
    zones: [], regions: [], categories: [], stores: [], brands: []
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ ...filters, page_size: 50000, dispatch_only: true }).toString();
      const res = await fetch(`http://localhost:8000/api/allocation/results?${q}`);
      const json = await res.json();
      
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
    if (!loading && sessionStorage.getItem('pending_print_dispatch_full') === 'true') {
      sessionStorage.removeItem('pending_print_dispatch_full');
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
      sessionStorage.setItem('pending_print_dispatch_full', 'true');
    } else {
      setForceExpandAll(true);
      setTimeout(() => {
        window.print();
        setForceExpandAll(false);
      }, 500);
    }
  };

  const handleDownloadExcel = (full) => {
    setExportMenuOpen(false);
    if (full) {
      window.open(`http://localhost:8000/api/allocation/results/export?group_by=zone&dispatch_only=true`, '_blank');
    } else {
      window.open(`http://localhost:8000/api/allocation/results/export?group_by=zone&dispatch_only=true&${new URLSearchParams(filters)}`, '_blank');
    }
  };

  const treeData = useMemo(() => {
    if (!data.length) return [];

    const summarize = (items) => {
      const allocated = items.reduce((a, b) => a + b.allocated_qty, 0);
      return { allocated };
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

  return (
    <div onClick={() => { setPrintMenuOpen(false); setExportMenuOpen(false); }}>
      <div className="page-header animate-in print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 100 }}>
        <h2>Dispatch Pick-List</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          
          {/* PRINT DROPDOWN */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-secondary" onClick={() => { setPrintMenuOpen(!printMenuOpen); setExportMenuOpen(false); }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 6 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print List ▼
            </button>
            {printMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 180, marginTop: 4, overflow: 'hidden' }}>
                <div 
                  onClick={() => handlePrint(false)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Print Filtered List
                </div>
                <div 
                  onClick={() => handlePrint(true)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Print Full Master List
                </div>
              </div>
            )}
          </div>

          {/* EXPORT DROPDOWN */}
          <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-primary" onClick={() => { setExportMenuOpen(!exportMenuOpen); setPrintMenuOpen(false); }}>
              Download Excel ▼
            </button>
            {exportMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: 180, marginTop: 4, overflow: 'hidden' }}>
                <div 
                  onClick={() => handleDownloadExcel(false)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Download Filtered Excel
                </div>
                <div 
                  onClick={() => handleDownloadExcel(true)} 
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

      <div className="print-only" style={{ display: 'none', marginBottom: 30, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'black' }}>CENTER FOR SIGHT</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#666' }}>Dispatch Order Pick-List (Hierarchy Generated: {new Date().toLocaleDateString()})</p>
        <hr style={{ marginTop: 16, borderColor: '#ccc' }} />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></div>
        </div>
      ) : data.length === 0 && metadata.zones.length === 0 ? (
        <div className="empty-state card print-hide">
          <h3>No Dispatch Data</h3>
          <p>Run the allocation engine from the Upload page first to generate picking lists.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
            Go to Ingestion
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          
          {/* FILTERS */}
          <div className="print-hide" style={{ background: 'var(--bg-app)', padding: '24px', borderRadius: 16, border: '1px solid var(--border)', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <h3 style={{ margin: 0, fontSize: 18 }}>Filters</h3>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {total.toLocaleString()} rows found
                </span>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => setFilters({ zone: '', region: '', store_category: '', store_name: '', brand_name: '', commodity: '' })} 
                  style={{ fontSize: 14, color: 'var(--danger)' }}
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Zone</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14 }} value={filters.zone} onChange={(e) => handleFilterChange('zone', e.target.value)}>
                  <option value="">All Zones</option>
                  {metadata.zones.map((z, i) => <option key={i} value={z}>{z}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Region</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14 }} value={filters.region} onChange={(e) => handleFilterChange('region', e.target.value)}>
                  <option value="">All Regions</option>
                  {metadata.regions.map((r, i) => <option key={i} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Store Grade</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14 }} value={filters.store_category} onChange={(e) => handleFilterChange('store_category', e.target.value)}>
                  <option value="">All Grades</option>
                  {metadata.categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Store Name</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14 }} value={filters.store_name} onChange={(e) => handleFilterChange('store_name', e.target.value)}>
                  <option value="">All Stores</option>
                  {metadata.stores.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Brand</label>
                <select className="filter-select" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14 }} value={filters.brand_name} onChange={(e) => handleFilterChange('brand_name', e.target.value)}>
                  <option value="">All Brands</option>
                  {metadata.brands.map((b, i) => <option key={i} value={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* TREE TABLE */}
          <div className="table-container print-full-width" style={{ border: '1px solid var(--border)', borderRadius: 12 }}>
            <table className="data-table" style={{ margin: 0, width: '100%', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <tr style={{ color: 'var(--primary-dark)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    <th colSpan={2} style={{ padding: '14px 16px', fontWeight: 700, borderBottom: '1px solid var(--border)' }}>Hierarchy Group</th>
                    <th style={{ padding: '14px 16px', fontWeight: 700, borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Total Dispatch Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {treeData.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        No dispatch rows match your filters.
                      </td>
                    </tr>
                  ) : (
                    treeData.map((node, idx) => (
                      <CollapsibleRow key={idx} node={node} forceExpandAll={forceExpandAll} />
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </div>
      )}
    </div>
  );
}
