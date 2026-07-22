import React, { useState, useEffect, useMemo, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../DataContext';
import MultiSelect from '../components/MultiSelect';
import AllocationDrillDown from '../components/AllocationDrillDown';
import PrintLayout from '../components/PrintLayout';
import AllocationModal from '../components/wizard/AllocationModal';

export default function AllocationReportPage() {
  const navigate = useNavigate();
  const { allocationData: masterData, lastRun, isLoadingData: loading, refreshData, filters, setFilters } = useContext(DataContext);

  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [printMode, setPrintMode] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    return masterData.filter(item => {
      if (filters.zone.length > 0 && !filters.zone.includes(item.zone)) return false;
      if (filters.region.length > 0 && !filters.region.includes(item.region)) return false;
      if (filters.store_category.length > 0 && !filters.store_category.includes(item.store_category)) return false;
      if (filters.store_name.length > 0 && !filters.store_name.includes(item.store_name)) return false;
      if (filters.brand_name.length > 0 && !filters.brand_name.includes(item.brand_name)) return false;
      if (filters.commodity?.length > 0 && !filters.commodity.includes(item.commodity)) return false;
      return true;
    });
  }, [masterData, filters]);



  useEffect(() => {
    // legacy pending_print check removed
  }, [loading]);



  const handlePrint = (full) => {
    setPrintMenuOpen(false);
    setPrintMode(full ? 'full' : 'filtered');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 500);
    }, 500);
  };

  const handleDownloadCsv = (full) => {
    setExportMenuOpen(false);
    const getBaseUrl = () => {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000'
        : 'https://optiflow-backend-977593391877.asia-south1.run.app';
    };

    if (full) {
      window.open(`${getBaseUrl()}/api/allocation/results/export?group_by=zone`, '_blank');
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
      window.open(`${getBaseUrl()}/api/allocation/results/export?${q}`, '_blank');
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

      <div className="page-header animate-in print-hide" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, position: 'relative', zIndex: 100 }}>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 28, fontWeight: 800 }}>Allocation</h1>
        </div>
        <div>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Allocation
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div className="print-no-padding">
          {/* DRILL DOWN UI */}
          <div className="print-hide" style={{ marginTop: 12 }}>
            <AllocationDrillDown 
              filteredData={filteredData} 
              filters={filters}
              setFilters={setFilters}
              isDispatch={false} 
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
                          <div onClick={() => handlePrint(false)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500 }} className="hover-row">Filtered</div>
                          <div onClick={() => handlePrint(true)} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500 }} className="hover-row">Full</div>
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
                          <div onClick={() => handleDownloadCsv(false)} style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }} className="hover-row">Filtered</div>
                          <div onClick={() => handleDownloadCsv(true)} style={{ padding: '12px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }} className="hover-row">Full</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      </div>

      {printMode && (
        <PrintLayout 
          data={printMode === 'full' ? masterData : filteredData} 
          isDispatch={false}
          title={printMode === 'full' ? 'Full Allocation Report' : 'Filtered Allocation Report'}
          subtitle={`Generated on ${new Date().toLocaleString()}`}
        />
      )}

      <AllocationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
