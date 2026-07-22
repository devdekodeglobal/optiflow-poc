import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../DataContext';
import MultiSelect from '../components/MultiSelect';
import AllocationDrillDown from '../components/AllocationDrillDown';
import PrintLayout from '../components/PrintLayout';

export default function DispatchPage() {
  const navigate = useNavigate();
  const { allocationData: masterData, lastRun, isLoadingData: loading, refreshData, dispatchFilters: filters, setDispatchFilters: setFilters } = useContext(DataContext);
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [printMode, setPrintMode] = useState(null); // { full: boolean, groupBy: string }

  const dispatchMasterData = useMemo(() => masterData.filter(i => (i.allocated_qty || 0) > 0), [masterData]);

  const filteredData = useMemo(() => {
    return dispatchMasterData.filter(item => {
      if (filters.zone.length > 0 && !filters.zone.includes(item.zone)) return false;
      if (filters.region.length > 0 && !filters.region.includes(item.region)) return false;
      if (filters.store_category.length > 0 && !filters.store_category.includes(item.store_category)) return false;
      if (filters.store_name.length > 0 && !filters.store_name.includes(item.store_name)) return false;
      if (filters.brand_name.length > 0 && !filters.brand_name.includes(item.brand_name)) return false;
      if (filters.commodity.length > 0 && !filters.commodity.includes(item.commodity)) return false;
      return true;
    });
  }, [dispatchMasterData, filters]);

  const dynamicMetadata = useMemo(() => {
    const getOptions = (field) => {
      const subset = dispatchMasterData.filter(item => {
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
      commodities: getOptions('commodity')
    };
  }, [dispatchMasterData, filters]);

  useEffect(() => {
    // legacy pending_print check removed
  }, [loading]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
  };

  const handlePrint = (full, groupBy) => {
    setPrintMenuOpen(false);
    setPrintMode({ full, groupBy });
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 500);
    }, 500);
  };

  const handleDownloadExcel = (full, groupBy) => {
    setExportMenuOpen(false);
    if (full) {
      window.open(`${import.meta.env.VITE_API_BASE_URL}/api/allocation/results/export?group_by=${groupBy}&dispatch_only=true`, '_blank');
    } else {
      const q = new URLSearchParams({ 
        zone: filters.zone.join(','),
        region: filters.region.join(','),
        store_category: filters.store_category.join(','),
        store_name: filters.store_name.join(','),
        brand_name: filters.brand_name.join(','),
        commodity: filters.commodity.join(','),
        group_by: groupBy,
        dispatch_only: 'true'
      }).toString();
      const baseUrl = 'http://127.0.0.1:8000';
      window.open(`${baseUrl}/api/allocation/results/export?${q}`, '_blank');
    }
  };


  if (loading && masterData.length === 0) {
    return (
      <div className="animate-in" style={{ padding: '4px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="skeleton skeleton-title" style={{ width: 200, height: 22, marginBottom: 8 }}></div>
            <div className="skeleton skeleton-text" style={{ width: 160, height: 16, borderRadius: 20 }}></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skeleton" style={{ width: 110, height: 32, borderRadius: 8 }}></div>
            <div className="skeleton" style={{ width: 130, height: 32, borderRadius: 8 }}></div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 4 }}></div>
              <div className="skeleton skeleton-text" style={{ width: 55, height: 16 }}></div>
              <div className="skeleton skeleton-text" style={{ width: 140, height: 14, borderRadius: 20 }}></div>
            </div>
            <div className="skeleton skeleton-text" style={{ width: 80, height: 14 }}></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 1.4fr', gap: 10 }}>
            {['Zone', 'Region', 'Store Grade', 'Store Name', 'Brand'].map(label => (
              <div key={label}>
                <div className="skeleton skeleton-text" style={{ width: 70, height: 12, marginBottom: 6 }}></div>
                <div className="skeleton" style={{ width: '100%', height: 34, borderRadius: 8 }}></div>
              </div>
            ))}
            <div>
              <div className="skeleton skeleton-text" style={{ width: 60, height: 12, marginBottom: 6 }}></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 8 }}></div>
                <div className="skeleton" style={{ flex: 1, height: 34, borderRadius: 8 }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 80px) 100px', padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', gap: 0, alignItems: 'center' }}>
            <div className="skeleton skeleton-text" style={{ width: 80, height: 12 }}></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton skeleton-text" style={{ width: 55, height: 12, justifySelf: 'end' }}></div>
            ))}
          </div>

          {[...Array(3)].map((_, z) => (
            <div key={z}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 80px) 100px', padding: '10px 16px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }}></div>
                  <div className="skeleton skeleton-text" style={{ width: `${90 + z * 35}px`, height: 14 }}></div>
                </div>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="skeleton skeleton-text" style={{ width: 45, height: 13, justifySelf: 'end' }}></div>
                ))}
              </div>
              {[...Array(3)].map((_, s) => (
                <div key={s} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 80px) 100px', padding: '8px 16px 8px 32px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="skeleton" style={{ width: 14, height: 14, borderRadius: 3 }}></div>
                    <div className="skeleton skeleton-text" style={{ width: `${70 + s * 25}px`, height: 13 }}></div>
                  </div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton skeleton-text" style={{ width: 35, height: 12, justifySelf: 'end' }}></div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
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
    <div className="report-container" onClick={() => { setPrintMenuOpen(false); setExportMenuOpen(false); }}>
      <div className="page-header animate-in print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 100 }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 28, fontWeight: 800 }}>Dispatch Orders</h1>
        </div>
      </div>

      <div className="print-only" style={{ display: 'none', marginBottom: 30, textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 24 }}>Dispatch Pick-List</h2>
        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#666' }}>Dispatch Order Pick-List {lastRun ? `(Generated: ${lastRun})` : ''}</p>
        <hr style={{ marginTop: 16, borderColor: '#ccc' }} />
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></div>
        </div>
      ) : masterData.length === 0 ? (
        <div className="empty-state card print-hide">
          <h3>No Dispatch Data</h3>
          <p>Run the allocation engine from the Upload page first to generate picking lists.</p>
          <button className="btn btn-primary" onClick={refreshData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
      ) : (
        <div className="animate-in" style={{ animationDelay: '0.1s' }}>
          
          <div className="print-hide" style={{ marginTop: 12 }}>
            <AllocationDrillDown 
              filteredData={filteredData} 
              filters={filters}
              setFilters={setFilters}
              isDispatch={true} 
              headerStrip={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderRadius: 16, background: 'transparent', border: '1px solid var(--border)' }}>
                  
                  {/* Left Side: Last Generated Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', background: '#fff', padding: '8px 16px', borderRadius: 24, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success)' }}></div>
                    Last generated: {lastRun || 'No data'}
                  </div>

                  {/* Right Side: Action Buttons */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>

                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn" 
                        onClick={() => { setPrintMenuOpen(!printMenuOpen); setExportMenuOpen(false); }} 
                        style={{ fontSize: 13, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontWeight: 600, color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                      >
                        Print Report ▼
                      </button>
                      {printMenuOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999, minWidth: 180, marginTop: 4, overflow: 'hidden' }}>
                          <div onClick={() => handlePrint(false, 'store')} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500 }} className="hover-row">Filtered (Store)</div>
                          <div onClick={() => handlePrint(false, 'brand')} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500 }} className="hover-row">Filtered (Brand)</div>
                          <div onClick={() => handlePrint(true, 'store')} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500 }} className="hover-row">Full (Store)</div>
                          <div onClick={() => handlePrint(true, 'brand')} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }} className="hover-row">Full (Brand)</div>
                        </div>
                      )}
                    </div>

                    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                      <button 
                        className="btn" 
                        onClick={() => { setExportMenuOpen(!exportMenuOpen); setPrintMenuOpen(false); }} 
                        style={{ fontSize: 13, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', fontWeight: 600, color: 'var(--text-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                      >
                        Download Report ▼
                      </button>
                      {exportMenuOpen && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 9999, minWidth: 180, marginTop: 4, overflow: 'hidden' }}>
                          <div onClick={() => handleDownloadExcel(false, 'store')} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }} className="hover-row">Filtered (Store)</div>
                          <div onClick={() => handleDownloadExcel(false, 'brand')} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }} className="hover-row">Filtered (Brand)</div>
                          <div onClick={() => handleDownloadExcel(true, 'store')} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }} className="hover-row">Full (Store)</div>
                          <div onClick={() => handleDownloadExcel(true, 'brand')} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }} className="hover-row">Full (Brand)</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      )}

      {printMode && (
        <PrintLayout 
          data={printMode.full ? dispatchMasterData : filteredData} 
          isDispatch={true} 
          title="Warehouse Dispatch Pick-List" 
          subtitle={printMode.full ? `Full List (${printMode.groupBy}-wise)` : `Filtered List (${printMode.groupBy}-wise)`} 
          groupBy={printMode.groupBy}
        />
      )}
    </div>
  );
}
