import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../DataContext';
import MultiSelect from '../components/MultiSelect';

import AllocationDrillDown from '../components/AllocationDrillDown';

export default function AllocationReportPage() {
  const navigate = useNavigate();
  const { allocationData: masterData, lastRun, isLoadingData: loading, refreshData } = useContext(DataContext);

  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    zone: [],
    region: [],
    store_category: [],
    store_name: [],
    brand_name: [],
    commodity: []
  });
  
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
      commodities: getOptions('commodity')
    };
  }, [masterData, filters]);



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
      setFilters({ zone: [], region: [], store_category: [], store_name: [], brand_name: [], commodity: [] });
      sessionStorage.setItem('pending_print_full', 'true');
    } else {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  const handleDownloadCsv = (full) => {
    setExportMenuOpen(false);
    if (full) {
      window.open(`${import.meta.env.VITE_API_BASE_URL}/api/allocation/results/export?group_by=zone`, '_blank');
    } else {
      const q = new URLSearchParams({ 
        zone: filters.zone.join(','),
        region: filters.region.join(','),
        store_category: filters.store_category.join(','),
        store_name: filters.store_name.join(','),
        brand_name: filters.brand_name.join(','),
        commodity: filters.commodity.join(','),
        group_by: 'zone'
      }).toString();
      const baseUrl = 'http://127.0.0.1:8000';
      window.open(`${baseUrl}/api/allocation/results/export?${q}`, '_blank');
    }
  };


  if (loading && masterData.length === 0) {
    return (
      <div className="animate-in" style={{ padding: '4px 0' }}>
        {/* Header bar */}
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
          {/* Filter bar label + reset */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 4 }}></div>
              <div className="skeleton skeleton-text" style={{ width: 60, height: 16 }}></div>
              <div className="skeleton skeleton-text" style={{ width: 120, height: 14, borderRadius: 20 }}></div>
            </div>
            <div className="skeleton skeleton-text" style={{ width: 80, height: 14 }}></div>
          </div>

          {/* Filter dropdowns row */}
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

        {/* Table card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(6, 90px)', gap: 0, padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            <div className="skeleton skeleton-text" style={{ width: 80, height: 12 }}></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton skeleton-text" style={{ width: 60, height: 12, justifySelf: 'end' }}></div>
            ))}
          </div>

          {/* Zone rows */}
          {[...Array(3)].map((_, z) => (
            <div key={z}>
              {/* Zone header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(6, 90px)', padding: '10px 16px', background: 'var(--bg-app)', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="skeleton" style={{ width: 16, height: 16, borderRadius: 3 }}></div>
                  <div className="skeleton skeleton-text" style={{ width: `${100 + z * 30}px`, height: 14 }}></div>
                </div>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="skeleton skeleton-text" style={{ width: 50, height: 13, justifySelf: 'end' }}></div>
                ))}
              </div>
              {/* Region sub-rows */}
              {[...Array(2)].map((_, r) => (
                <div key={r} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(6, 90px)', padding: '8px 16px 8px 36px', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                  <div className="skeleton skeleton-text" style={{ width: `${80 + r * 20}px`, height: 13 }}></div>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton skeleton-text" style={{ width: 40, height: 12, justifySelf: 'end' }}></div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (masterData.length === 0) {
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
      <div className="print-only" style={{ display: 'none', marginBottom: 30, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: 'black', fontFamily: '"Montserrat", sans-serif', textTransform: 'uppercase', letterSpacing: '-0.5px', transform: 'scaleX(0.95)', transformOrigin: 'center' }}>CENTER FOR SIGHT</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#666' }}>Allocation Report {lastRun ? `(Generated: ${lastRun})` : ''}</p>
        <hr style={{ marginTop: 16, borderColor: '#ccc' }} />
      </div>

      <div className="page-header animate-in print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 style={{ margin: 0 }}>Allocation Report</h2>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, background: 'var(--bg-surface)', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--border)' }}>
            {lastRun ? `Last generated: ${lastRun}` : 'Not yet generated'}
          </div>
        </div>
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
                  Filtered
                </div>
                <div 
                  onClick={() => handlePrint(true)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }}
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
                  onClick={() => handleDownloadCsv(false)} 
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}
                  className="hover-row"
                >
                  Filtered
                </div>
                <div 
                  onClick={() => handleDownloadCsv(true)} 
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

      <div className="card animate-in" style={{ marginTop: 12, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px' }} className="print-no-padding">
          
          {/* FILTERS */}
          <div className="print-hide" style={{ background: 'var(--bg-app)', padding: showFilters ? '16px' : '8px 16px', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 16, transition: 'padding 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: showFilters ? 16 : 0 }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <h3 
                style={{ margin: 0, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none' }} 
                onClick={() => setShowFilters(!showFilters)}
              >
                Filters
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {showFilters ? '▼' : '▶'}
                </span>
              </h3>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 15, color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {filteredData.length.toLocaleString()} allocations created
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ zone: [], store_category: [], region: [], store_name: [], brand_name: [], commodity: [] })} style={{ fontSize: 14, color: 'var(--primary)' }}>
                  Reset Filters
                </button>
              </div>
            </div>
            {showFilters && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
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
                  <MultiSelect placeholder="All Grades" options={dynamicMetadata.store_categories || dynamicMetadata.categories} value={filters.store_category} onChange={(val) => handleFilterChange('store_category', val)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Store Name</label>
                  <MultiSelect placeholder="All Stores" options={dynamicMetadata.stores} value={filters.store_name} onChange={(val) => handleFilterChange('store_name', val)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Brand</label>
                  <MultiSelect placeholder="All Brands" options={dynamicMetadata.brands} value={filters.brand_name} onChange={(val) => handleFilterChange('brand_name', val)} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Category</label>
                  <div style={{ display: 'flex', gap: 10, flex: 1, alignItems: 'center' }}>
                  {dynamicMetadata.commodities.map(c => {
                    const isSelected = filters.commodity.length === 0 || filters.commodity.includes(c);
                    return (
                      <button 
                        key={c}
                        style={{
                          flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                          border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                          background: isSelected ? 'var(--primary)' : '#fff',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          boxShadow: isSelected ? '0 2px 8px rgba(59, 35, 123, 0.25)' : 'none'
                        }}
                        onClick={() => {
                          let next = [];
                          if (filters.commodity.length === 0) {
                            next = dynamicMetadata.commodities.filter(x => x !== c);
                          } else {
                            if (isSelected) {
                              next = filters.commodity.filter(x => x !== c);
                              if (next.length === 0) next = ['__NONE__'];
                            } else {
                              next = [...filters.commodity.filter(x => x !== '__NONE__'), c];
                              if (next.length === dynamicMetadata.commodities.length) next = [];
                            }
                          }
                          handleFilterChange('commodity', next);
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            )}
          </div>

                    {/* DRILL DOWN UI */}
          <div style={{ marginTop: 24 }}>
            <AllocationDrillDown 
              filteredData={filteredData} 
              filters={filters} 
              setFilters={setFilters} 
              isDispatch={false} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
