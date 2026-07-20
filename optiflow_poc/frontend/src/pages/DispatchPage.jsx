import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import MultiSelect from '../components/MultiSelect';

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
    zone: searchParams.get('zone') ? searchParams.get('zone').split(',') : [],
    region: searchParams.get('region') ? searchParams.get('region').split(',') : [],
    store_category: searchParams.get('store_category') ? searchParams.get('store_category').split(',') : [],
    store_name: searchParams.get('store_name') ? searchParams.get('store_name').split(',') : [],
    brand_name: searchParams.get('brand_name') ? searchParams.get('brand_name').split(',') : [],
    commodity: searchParams.get('commodity') ? searchParams.get('commodity').split(',') : []
  });

  const [masterData, setMasterData] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ 
        page_size: 50000, 
        dispatch_only: true 
      }).toString();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://optiflow-backend-977593391877.us-central1.run.app';
      const res = await fetch(`${baseUrl}/api/allocation/results?${q}`);
      const json = await res.json();
      
      if (!res.ok) {
        if (res.status === 404) setMasterData([]);
        return;
      }
      
      setMasterData(json.allocations || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    return masterData.filter(item => {
      if (filters.zone.length > 0 && !filters.zone.includes(item.zone)) return false;
      if (filters.region.length > 0 && !filters.region.includes(item.region)) return false;
      if (filters.store_category.length > 0 && !filters.store_category.includes(item.store_category)) return false;
      if (filters.store_name.length > 0 && !filters.store_name.includes(item.store_name)) return false;
      if (filters.brand_name.length > 0 && !filters.brand_name.includes(item.brand_name)) return false;
      if (filters.commodity.length > 0 && !filters.commodity.includes(item.commodity)) return false;
      return true;
    });
  }, [masterData, filters]);

  const dynamicMetadata = useMemo(() => {
    const getOptions = (field) => {
      const subset = masterData.filter(item => {
        if (field !== 'zone' && filters.zone.length > 0 && !filters.zone.includes(item.zone)) return false;
        if (field !== 'region' && filters.region.length > 0 && !filters.region.includes(item.region)) return false;
        if (field !== 'store_category' && filters.store_category.length > 0 && !filters.store_category.includes(item.store_category)) return false;
        if (field !== 'store_name' && filters.store_name.length > 0 && !filters.store_name.includes(item.store_name)) return false;
        if (field !== 'brand_name' && filters.brand_name.length > 0 && !filters.brand_name.includes(item.brand_name)) return false;
        if (field !== 'commodity' && filters.commodity.length > 0 && !filters.commodity.includes(item.commodity)) return false;
        return true;
      });
      return [...new Set(subset.map(a => a[field]).filter(Boolean))].sort();
    };

    return {
      zones: getOptions('zone'),
      regions: getOptions('region'),
      categories: getOptions('store_category'),
      stores: getOptions('store_name'),
      brands: getOptions('brand_name'),
      commodities: ['Frame', 'Lens', 'Contact Lens', 'Sunglasses']
    };
  }, [masterData, filters]);

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
      setFilters({ zone: [], region: [], store_category: [], store_name: [], brand_name: [], commodity: [] });
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
      window.open(`${import.meta.env.VITE_API_BASE_URL}/api/allocation/results/export?group_by=zone&dispatch_only=true`, '_blank');
    } else {
      const q = new URLSearchParams({ 
        zone: filters.zone.join(','),
        region: filters.region.join(','),
        store_category: filters.store_category.join(','),
        store_name: filters.store_name.join(','),
        brand_name: filters.brand_name.join(','),
        commodity: filters.commodity.join(','),
        group_by: 'zone',
        dispatch_only: true 
      }).toString();
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://optiflow-backend-977593391877.us-central1.run.app';
      window.open(`${baseUrl}/api/allocation/results/export?${q}`, '_blank');
    }
  };

  const treeData = useMemo(() => {
    if (!filteredData.length) return [];

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

    return buildTree(filteredData, ['zone', 'region', 'store_category', 'store_name', 'brand_name']);
  }, [filteredData]);

  if (loading && masterData.length === 0) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading Dispatch Orders...</div>;
  }

  if (masterData.length === 0 && !Object.values(filters).some(v => v.length > 0)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', marginTop: 100 }}>
        <div className="card animate-in" style={{ display: 'inline-block', padding: 40 }}>
          <h3 style={{ marginBottom: 10 }}>No Dispatch Orders</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Run an allocation to generate dispatch orders.</p>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => { setPrintMenuOpen(false); setExportMenuOpen(false); }}>
      <div className="page-header animate-in print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 100 }}>
        <h2>Dispatch Pick-List</h2>
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
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Filtered
                </div>
                <div 
                  onClick={() => handlePrint(true)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Full
                </div>
              </div>
            )}
          </div>

          {/* EXPORT DROPDOWN */}
          <div style={{ position: 'relative', zIndex: 9999 }} onClick={e => e.stopPropagation()}>
            <button className="btn btn-ghost" onClick={() => { setExportMenuOpen(!exportMenuOpen); setPrintMenuOpen(false); }}>
              Download Report ▼
            </button>
            {exportMenuOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999, minWidth: 180, marginTop: 4, overflow: 'hidden' }}>
                <div 
                  onClick={() => handleDownloadExcel(false)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Filtered
                </div>
                <div 
                  onClick={() => handleDownloadExcel(true)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Full
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
                  {filteredData.length.toLocaleString()} dispatch orders created
                </span>
                <button 
                  className="btn btn-ghost btn-sm" 
                  onClick={() => setFilters({ zone: [], region: [], store_category: [], store_name: [], brand_name: [], commodity: [] })} 
                  style={{ fontSize: 14, color: 'var(--primary)' }}
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Zone</label>
                <MultiSelect placeholder="All Zones" options={dynamicMetadata.zones} value={filters.zone} onChange={(val) => handleFilterChange('zone', val)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Region</label>
                <MultiSelect placeholder="All Regions" options={dynamicMetadata.regions} value={filters.region} onChange={(val) => handleFilterChange('region', val)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Store Grade</label>
                <MultiSelect placeholder="All Grades" options={dynamicMetadata.categories} value={filters.store_category} onChange={(val) => handleFilterChange('store_category', val)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Store Name</label>
                <MultiSelect placeholder="All Stores" options={dynamicMetadata.stores} value={filters.store_name} onChange={(val) => handleFilterChange('store_name', val)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Brand</label>
                <MultiSelect placeholder="All Brands" options={dynamicMetadata.brands} value={filters.brand_name} onChange={(val) => handleFilterChange('brand_name', val)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Category</label>
                <MultiSelect placeholder="All Categories" options={dynamicMetadata.commodities} value={filters.commodity} onChange={(val) => handleFilterChange('commodity', val)} />
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
