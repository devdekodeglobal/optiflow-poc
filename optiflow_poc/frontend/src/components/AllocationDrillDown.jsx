import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

const HIERARCHY = ['network', 'zone', 'region', 'store_category', 'store_name', 'brand_name', 'commodity'];

const COLORS = {
  fulfilled: '#20c997', // teal
  outOfStock: '#ff6b6b', // red
  ok: '#20c997',
  warning: '#fcc419',
  critical: '#ff6b6b',
};

const HIERARCHY_LABELS = {
  network: 'All Zones',
  zone: 'Zone',
  region: 'Region',
  store_category: 'Store Grade',
  store_name: 'Store',
  brand_name: 'Brand',
  commodity: 'Commodity'
};

export default function AllocationDrillDown({ 
  filteredData, 
  filters, 
  setFilters,
  isDispatch = false,
  headerStrip
}) {
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'

  // Determine current drill down level based on active filters
  const currentLevelIndex = useMemo(() => {
    let index = 0;
    if (filters.zone && filters.zone.length === 1) index = 1;
    if (index === 1 && filters.region && filters.region.length === 1) index = 2;
    if (index === 2 && filters.store_category && filters.store_category.length === 1) index = 3;
    if (index === 3 && filters.store_name && filters.store_name.length === 1) index = 4;
    if (index === 4 && filters.brand_name && filters.brand_name.length === 1) index = 5;
    if (index === 5 && filters.commodity && filters.commodity.length === 1) index = 6;
    return index;
  }, [filters]);

  const currentLevelName = HIERARCHY[currentLevelIndex];
  const nextLevelName = HIERARCHY[currentLevelIndex + 1];

  // Summarize current filtered data for the top KPI bar
  const summary = useMemo(() => {
    const uniqueGapsMap = {};
    const uniqueSohMap = {};
    const uniqueExpectedMap = {};
    
    filteredData.forEach(i => {
      uniqueGapsMap[i.gap_id] = i.deficit;
      uniqueSohMap[i.gap_id] = i.current_soh;
      uniqueExpectedMap[i.gap_id] = (i.facing || 0) + (i.back_stock || 0);
    });

    const deficit = Object.values(uniqueGapsMap).reduce((a, b) => a + b, 0);
    const soh = Object.values(uniqueSohMap).reduce((a, b) => a + b, 0);
    const expected = Object.values(uniqueExpectedMap).reduce((a, b) => a + b, 0);
    const allocated = filteredData.reduce((a, b) => a + (b.allocated_qty || 0), 0);
    const outOfStock = Math.max(0, deficit - allocated);
    const fulfillRate = expected > 0 ? (allocated / expected) * 100 : 0;

    return { expected, soh, deficit, allocated, outOfStock, fulfillRate };
  }, [filteredData]);

  // Group data by next level to render cards/table
  const childrenData = useMemo(() => {
    if (!nextLevelName) return [];

    const grouped = {};
    filteredData.forEach(item => {
      if (isDispatch && item.allocated_qty === 0) return; // Ignore unallocated for dispatch grouping
      let key = item[nextLevelName] || `Unknown ${nextLevelName}`;
      if (isDispatch && nextLevelName === 'store_name') {
        key = `${item.store_name} / ${item.zone}`;
      }
      if (!grouped[key]) {
        grouped[key] = { items: [], displayName: key };
      }
      grouped[key].items.push(item);
    });

    return Object.entries(grouped).map(([key, groupObj]) => {
      const items = groupObj.items;
      const uniqueGapsMap = {};
      const uniqueSohMap = {};
      const uniqueExpectedMap = {};
      items.forEach(i => {
        uniqueGapsMap[i.gap_id] = i.deficit;
        uniqueSohMap[i.gap_id] = i.current_soh;
        uniqueExpectedMap[i.gap_id] = (i.facing || 0) + (i.back_stock || 0);
      });
      const expected = Object.values(uniqueExpectedMap).reduce((a, b) => a + b, 0);
      const soh = Object.values(uniqueSohMap).reduce((a, b) => a + b, 0);
      const allocated = items.reduce((a, b) => a + (b.allocated_qty || 0), 0);
      const deficit = Object.values(uniqueGapsMap).reduce((a, b) => a + b, 0);
      const outOfStock = Math.max(0, deficit - allocated);
      const ratio = expected > 0 ? (allocated / expected) * 100 : 0;
      
      const uniqueSkus = isDispatch ? new Set(items.map(i => i.allocated_item_code)).size : 0;
      const stores = isDispatch ? new Set(items.map(i => i.store_name)).size : 0;

      return { name: key, displayName: groupObj.displayName, expected, soh, allocated, outOfStock, ratio, count: items.length, uniqueSkus, stores };
    }).sort((a, b) => isDispatch ? b.allocated - a.allocated : b.expected - a.expected);
  }, [filteredData, nextLevelName, isDispatch]);

  const rowsWithIds = useMemo(() => filteredData.map((r, i) => ({ ...r, _uid: i })), [filteredData]);

  const handleDrillDown = (childName) => {
    const newFilters = { ...filters };
    newFilters[nextLevelName] = [childName];
    setFilters(newFilters);
  };

  const handleBreadcrumbClick = (levelIndex) => {
    const newFilters = { ...filters };
    // Clear filters below the clicked level
    if (levelIndex < 6) newFilters.commodity = [];
    if (levelIndex < 5) newFilters.brand_name = [];
    if (levelIndex < 4) newFilters.store_name = [];
    if (levelIndex < 3) newFilters.store_category = [];
    if (levelIndex < 2) newFilters.region = [];
    if (levelIndex < 1) newFilters.zone = [];
    
    setFilters(newFilters);
  };

  const renderKPIBar = () => {
    if (isDispatch) {
      const dispatchItems = filteredData.filter(i => i.allocated_qty > 0);
      const unitsToPick = dispatchItems.reduce((a, b) => a + b.allocated_qty, 0);
      const uniqueSkus = new Set(dispatchItems.map(i => i.allocated_item_code)).size;
      const stores = new Set(dispatchItems.map(i => i.store_name)).size;
      
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
          <div className="card animate-in" style={{ padding: '12px 16px', background: '#fff', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 2 }}>TOTAL UNITS TO PICK</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.fulfilled }}>{unitsToPick.toLocaleString()}</div>
          </div>
          <div className="card animate-in" style={{ padding: '12px 16px', background: '#fff', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 2 }}>UNIQUE SKUS</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{uniqueSkus.toLocaleString()}</div>
          </div>
          <div className="card animate-in" style={{ padding: '12px 16px', background: '#fff', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 2 }}>STORES TO FULFILL</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{stores.toLocaleString()}</div>
          </div>
        </div>
      );
    }
    
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>EXPECTED QTY</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{summary.expected.toLocaleString()}</div>
        </div>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>IN HAND</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{summary.soh.toLocaleString()}</div>
        </div>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>FULFILLED</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.fulfilled }}>{summary.allocated.toLocaleString()}</div>
        </div>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>OUT OF STOCK</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.outOfStock }}>{summary.outOfStock.toLocaleString()}</div>
        </div>
        <div className="card animate-in" style={{ padding: '16px 20px', background: '#fff', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5, marginBottom: 4 }}>FULFILLMENT %</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{summary.fulfillRate.toFixed(0)}%</div>
        </div>
      </div>
    );
  };

  const renderBreadcrumbs = () => {
    const crumbs = [];
    crumbs.push(
      <span key="network" style={{ cursor: 'pointer', color: currentLevelIndex === 0 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 0 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(0)}>
        All Zones
      </span>
    );

    if (currentLevelIndex >= 1) {
      crumbs.push(<span key="sep1" style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>/</span>);
      crumbs.push(
        <span key="zone" style={{ cursor: 'pointer', color: currentLevelIndex === 1 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 1 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(1)}>
          {filters.zone[0]}
        </span>
      );
    }
    if (currentLevelIndex >= 2) {
      crumbs.push(<span key="sep2" style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>/</span>);
      crumbs.push(
        <span key="region" style={{ cursor: 'pointer', color: currentLevelIndex === 2 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 2 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(2)}>
          {filters.region[0]}
        </span>
      );
    }
    if (currentLevelIndex >= 3) {
      crumbs.push(<span key="sep3" style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>/</span>);
      crumbs.push(
        <span key="grade" style={{ cursor: 'pointer', color: currentLevelIndex === 3 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 3 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(3)}>
          Grade {filters.store_category[0]}
        </span>
      );
    }
    if (currentLevelIndex >= 4) {
      crumbs.push(<span key="sep4" style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>/</span>);
      crumbs.push(
        <span key="store" style={{ cursor: 'pointer', color: currentLevelIndex === 4 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 4 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(4)}>
          {filters.store_name[0]}
        </span>
      );
    }
    if (currentLevelIndex >= 5) {
      crumbs.push(<span key="sep5" style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>/</span>);
      crumbs.push(
        <span key="brand" style={{ cursor: 'pointer', color: currentLevelIndex === 5 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 5 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(5)}>
          {filters.brand_name[0]}
        </span>
      );
    }
    if (currentLevelIndex >= 6) {
      crumbs.push(<span key="sep6" style={{ margin: '0 8px', color: 'var(--text-secondary)' }}>/</span>);
      crumbs.push(
        <span key="commodity" style={{ cursor: 'pointer', color: currentLevelIndex === 6 ? 'var(--text-primary)' : 'var(--brand-primary)', fontWeight: currentLevelIndex === 6 ? 700 : 500 }} onClick={() => handleBreadcrumbClick(6)}>
          {filters.commodity[0]}
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
        {crumbs}
      </div>
    );
  };

  const renderCards = () => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {childrenData.map((child, idx) => {
          if (isDispatch) {
            return (
              <div 
                key={idx} 
                className="card animate-in" 
                style={{ padding: '16px 20px', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
                onClick={() => {
                  const rawName = (isDispatch && nextLevelName === 'store_name') ? child.name.split(' / ')[0] : child.name;
                  handleDrillDown(rawName);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isDispatch && nextLevelName === 'store_name' ? child.name.split('/')[0] : child.displayName}
                  </h4>
                  <svg width="16" height="16" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid #f1f3f5', paddingBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Units</span>
                    <span style={{ fontWeight: 800, color: COLORS.fulfilled }}>{child.allocated.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid #f1f3f5', paddingBottom: 4 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>SKUs</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{child.uniqueSkus.toLocaleString()}</span>
                  </div>
                  {currentLevelIndex < 3 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Stores</span>
                      <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{child.stores.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }

          let ratioColor = COLORS.ok;
          if (child.ratio < 30) ratioColor = COLORS.critical;
          else if (child.ratio < 60) ratioColor = COLORS.warning;

          const gaugeData = [
            { name: 'Fulfilled', value: child.allocated, color: ratioColor },
            { name: 'Unfulfilled', value: Math.max(0, child.expected - child.allocated), color: '#f1f3f5' }
          ];

          return (
            <div 
              key={idx} 
              className="card animate-in" 
              style={{ padding: 20, cursor: 'pointer', transition: 'all 0.2s', border: '1px solid var(--border)' }}
              onClick={() => handleDrillDown(child.name)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{child.name}</h4>
                <svg width="16" height="16" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 80, height: 80, position: 'relative' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gaugeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={40}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {gaugeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: ratioColor }}>
                    {child.ratio.toFixed(0)}%
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Expected</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{child.expected.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>In Hand</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{child.soh.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Fulfilled</span>
                    <span style={{ fontWeight: 700, color: COLORS.fulfilled }}>{child.allocated.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Out of Stock</span>
                    <span style={{ fontWeight: 700, color: COLORS.outOfStock }}>{child.outOfStock.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = () => {
    const columns = [
      { 
        key: 'name', 
        name: (HIERARCHY_LABELS[nextLevelName] || '').toUpperCase(), 
        resizable: true,
        renderCell: (p) => {
          // If we are at store level in dispatch, clean up the display name for the click handler
          const rawName = (isDispatch && nextLevelName === 'store_name') ? p.row.name.split(' / ')[0] : p.row.name;
          return (
            <span 
              style={{ 
                color: currentLevelIndex < 6 ? 'var(--primary)' : 'inherit', 
                cursor: currentLevelIndex < 6 ? 'pointer' : 'default',
                textDecoration: currentLevelIndex < 6 ? 'underline' : 'none',
                fontWeight: 600
              }}
              onClick={() => {
                if (currentLevelIndex < 6) handleDrillDown(rawName);
              }}
            >
              {p.row.displayName || p.row.name}
            </span>
          );
        }
      }
    ];

    if (isDispatch) {
      columns.push(
        { key: 'allocated', name: 'ITEMS TO PICK', resizable: true, renderCell: (p) => <span style={{fontWeight: 700, color: 'var(--primary)'}}>{p.row.allocated.toLocaleString()}</span> },
        { key: 'uniqueSkus', name: 'UNIQUE SKUS', resizable: true, renderCell: (p) => <span style={{fontWeight: 600}}>{p.row.uniqueSkus.toLocaleString()}</span> }
      );
      if (currentLevelIndex < 3) {
        columns.push(
          { key: 'stores', name: 'STORES', resizable: true, renderCell: (p) => <span style={{fontWeight: 600}}>{p.row.stores.toLocaleString()}</span> }
        );
      }
    } else {
      columns.push(
        { key: 'expected', name: 'EXPECTED', resizable: true, renderCell: (p) => p.row.expected.toLocaleString() },
        { key: 'soh', name: 'IN HAND', resizable: true, renderCell: (p) => p.row.soh.toLocaleString() },
        { key: 'allocated', name: 'FULFILLED', resizable: true, renderCell: (p) => <span style={{color: COLORS.fulfilled, fontWeight: 600}}>{p.row.allocated.toLocaleString()}</span> },
        { key: 'outOfStock', name: 'OUT OF STOCK', resizable: true, renderCell: (p) => <span style={{color: COLORS.outOfStock, fontWeight: 600}}>{p.row.outOfStock.toLocaleString()}</span> },
        { key: 'ratio', name: 'FULFILLMENT', resizable: true, renderCell: (p) => {
          let ratioColor = COLORS.ok;
          if (p.row.ratio < 30) ratioColor = COLORS.critical;
          else if (p.row.ratio < 60) ratioColor = COLORS.warning;
          return <span style={{color: ratioColor, fontWeight: 700}}>{p.row.ratio.toFixed(0)}%</span>;
        } }
      );
    }

    return (
      <div className="animate-in" style={{ height: 'auto' }}>
        <DataGrid
          columns={columns}
          rows={childrenData}
          rowKeyGetter={(row) => row.name}
          className="rdg-light"
          style={{ height: 'auto' }}
          rowHeight={52}
          headerRowHeight={48}
          onRowClick={(row) => {
            // Only drill down further if we are not already at the commodity level
            const rawName = (isDispatch && nextLevelName === 'store_name') ? row.name.split(' / ')[0] : row.name;
            if (currentLevelIndex < 6) handleDrillDown(rawName);
          }}
        />
      </div>
    );
  };

  const renderFinalDetails = () => {
    if (isDispatch) {
      return (
        <div className="animate-in" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <tr style={{ color: 'var(--text-secondary)' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Allocated SKU</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Item Description</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Store / Brand</th>
                <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Dispatch Qty</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.filter(item => item.allocated_qty > 0).map((item, idx) => (
                <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{item.allocated_item_code || "N/A"}</td>
                  <td style={{ padding: '10px 16px' }}>{item.allocated_item_name || "N/A"}</td>
                  <td style={{ padding: '10px 16px' }}>{`${item.store_name} / ${item.brand_name}`}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 600 }}>{item.allocated_qty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="animate-in" style={{ maxHeight: '600px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg-surface)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <tr style={{ color: 'var(--text-secondary)' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Target SKU</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Allocated SKU</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Amount Allocated</th>
              <th style={{ textAlign: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Match Type</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Reasoning</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace' }}>{item.requested_item_code || "N/A"}</td>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>{item.allocated_item_code || "N/A"}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>{item.allocated_qty}</td>
                <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                  {item.match_type && (
                    <span style={{ 
                      fontSize: 11, padding: '4px 10px', borderRadius: 12, fontWeight: 700,
                      background: item.match_type.toLowerCase() === 'exact' ? 'rgba(46,204,113,0.15)' : item.match_type.toLowerCase() === 'similar' ? 'rgba(52,152,219,0.15)' : 'rgba(241,196,15,0.15)',
                      color: item.match_type.toLowerCase() === 'exact' ? 'var(--success)' : item.match_type.toLowerCase() === 'similar' ? 'var(--primary)' : 'var(--warning-dark)'
                    }}>
                      {item.match_type.toUpperCase()}
                    </span>
                  )}
                </td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{item.match_reason || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        {renderBreadcrumbs()}
      </div>

      {headerStrip && (
        <div style={{ marginBottom: 16 }}>
          {headerStrip}
        </div>
      )}

      {renderKPIBar()}

      {currentLevelIndex < 6 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            {!isDispatch && (
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.critical }}></div>
                  <span style={{ fontWeight: 600 }}>Critical &lt;30%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.warning }}></div>
                  <span style={{ fontWeight: 600 }}>Warning 30–59%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS.ok }}></div>
                  <span style={{ fontWeight: 600 }}>OK 60%+</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', background: '#f8f9fa', borderRadius: 8, padding: 4, border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                background: viewMode === 'cards' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Table
            </button>
          </div>
        </div>
      )}

      {/* Redundant bar chart removed */}

      {currentLevelIndex < 6 ? (
        viewMode === 'cards' ? renderCards() : renderTable()
      ) : (
        renderFinalDetails()
      )}
    </div>
  );
}
