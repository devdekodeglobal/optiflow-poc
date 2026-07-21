import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataContext } from '../DataContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

const COLORS = {
  fulfilled: '#20c997', // Teal
  outOfStock: '#ff6b6b', // Coral
  soh: '#4c6ef5', // Indigo
  deficit: '#fcc419', // Gold
};

const BREAKDOWN_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'
];

export default function OverallDashboard() {
  const navigate = useNavigate();
  const { dashboardData, isLoadingData: loading, refreshData } = useContext(DataContext);
  const data = dashboardData?.allocations || [];
  const globalWhStock = dashboardData?.warehouse_stock_total || 0;
  
  // Drill-down state
  const [level, setLevel] = useState('network');
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const summarize = (items) => {
    const uniqueGapsMap = {};
    const uniqueSohMap = {};
    const uniqueWhStockMap = {};
    items.forEach(i => { 
      if (i.gap_id !== undefined && i.gap_id !== null) {
        uniqueGapsMap[i.gap_id] = i.deficit || 0; 
        uniqueSohMap[i.gap_id] = i.current_soh || 0;
      }
      if (i.allocated_item_code) {
        uniqueWhStockMap[i.allocated_item_code] = i.initial_wh_stock || 0;
      }
    });
    const deficit = Object.values(uniqueGapsMap).reduce((a, b) => a + b, 0);
    const soh = Object.values(uniqueSohMap).reduce((a, b) => a + b, 0);
    // Warehouse stock is the constant full Corporate Office total — not filtered
    const warehouseStock = globalWhStock;
    const allocated = items.reduce((a, b) => a + (b.allocated_qty || 0), 0);
    const outOfStock = Math.max(0, deficit - allocated);
    return { soh, deficit, allocated, outOfStock, warehouseStock };
  };

  const handleDispatchAction = () => {
    const params = new URLSearchParams();
    if (level === 'zones' && selectedZone) params.set('zone', selectedZone);
    if (level === 'regions' && selectedRegion) {
      params.set('zone', selectedZone);
      params.set('region', selectedRegion);
    }
    if (level === 'stores' && selectedStore) {
      params.set('store_name', selectedStore);
    }
    navigate(`/dispatch?${params.toString()}`);
  };

  const FulfillmentGauge = ({ pct }) => {
    const radius = 54;
    const circumference = Math.PI * radius; // semicircle
    const filled = circumference * (Math.min(pct, 100) / 100);
    const color = pct >= 70 ? '#2ecc71' : pct >= 40 ? '#f1c40f' : '#e74c3c';
    return (
      <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 160 }}>
        <h4 style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fulfillment</h4>
        <svg width="140" height="80" viewBox="0 0 140 80" style={{ overflow: 'visible' }}>
          {/* Background arc */}
          <path d="M 10,70 A 60,60 0 0,1 130,70" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="14" strokeLinecap="round" />
          {/* Filled arc */}
          <path
            d="M 10,70 A 60,60 0 0,1 130,70"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 188.5} 188.5`}
            style={{ transition: 'stroke-dasharray 0.8s ease, stroke 0.4s' }}
          />
          <text x="70" y="68" textAnchor="middle" style={{ fontSize: 26, fontWeight: 800, fill: color }}>{Math.round(pct)}%</text>
          <text x="70" y="80" textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-muted)' }}>of deficit fulfilled</text>
        </svg>
      </div>
    );
  };

  const getMetricCards = (summary) => {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24, marginBottom: 32, alignItems: 'stretch' }}>
        <div className="summary-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(76, 110, 245, 0.15)', padding: '10px', borderRadius: '10px', color: '#4c6ef5', display: 'flex' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>WAREHOUSE STOCK</h4>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{summary.warehouseStock.toLocaleString()}</div>
        </div>
        
        <div className="summary-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(245, 159, 0, 0.15)', padding: '10px', borderRadius: '10px', color: '#f59f00', display: 'flex' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>PLANOGRAM TARGET</h4>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{(summary.soh + summary.deficit).toLocaleString()}</div>
        </div>
        
        <div className="summary-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(32, 201, 151, 0.15)', padding: '10px', borderRadius: '10px', color: '#20c997', display: 'flex' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>STOCK IN STORE</h4>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{summary.soh.toLocaleString()}</div>
        </div>
        
        <div className="summary-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ background: 'rgba(255, 107, 107, 0.15)', padding: '10px', borderRadius: '10px', color: '#ff6b6b', display: 'flex' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            </div>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>TOTAL DEFICIT</h4>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)' }}>{summary.deficit.toLocaleString()}</div>
        </div>
      </div>
    );
  };

  const renderDualCharts = (summary) => {
    const fulfillData = [
      { name: 'Fulfilled', value: summary.allocated, color: COLORS.fulfilled },
      { name: 'Out of Stock', value: summary.outOfStock, color: COLORS.outOfStock }
    ];
    // We treat "Planogram Target" as the gap deficit that is remaining
    // Or Planogram Deficit vs SOH
    const stockData = [
      { name: 'Stock in Store', value: summary.soh, color: COLORS.soh },
      { name: 'Planogram Deficit', value: summary.deficit, color: COLORS.deficit }
    ];

    const getPieStyle = (name) => ({
      stroke: 'none',
      strokeWidth: 2
    });

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
      if (percent < 0.05) return null;
      return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 13, fontWeight: 700, textShadow: '0px 1px 3px rgba(0,0,0,0.6)', pointerEvents: 'none' }}>
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };

    let leftTitle = 'Planogram vs National Stock';
    if (level === 'zones') leftTitle = `Planogram vs ${selectedZone} Stock`;
    else if (level === 'regions') leftTitle = `Planogram vs ${selectedRegion} Stock`;
    else if (level === 'stores') leftTitle = `Planogram vs ${selectedStore} Stock`;
    else if (level === 'brands') leftTitle = `Planogram vs ${selectedBrand} Stock`;

    return (
      <div className="card animate-in" style={{ padding: 24, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h4>{leftTitle}</h4>
        <div style={{ width: '100%', flex: 1, minHeight: 400 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={stockData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={120} paddingAngle={0} label={renderCustomizedLabel} labelLine={false} isAnimationActive={false}>
                {stockData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={getPieStyle(entry.name)} />)}
              </Pie>
              <Tooltip formatter={(val) => val.toLocaleString()} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDrillDownGraph = (entityLabel, itemsMap, onClickHandler) => {
    const getColor = (ratio) => {
      if (ratio === 0) return '#adb5bd';
      if (ratio <= 30) return '#ff6b6b';
      if (ratio <= 59) return '#fcc419';
      return '#20c997';
    };

    const barData = Object.keys(itemsMap).map((key) => {
      const s = summarize(itemsMap[key]);
      const target = s.soh + s.deficit;
      const stockRatio = target > 0 ? (s.soh / target) * 100 : 100;
      return {
        name: key,
        'Stock Ratio (%)': Math.round(stockRatio),
        planogram: target,
        stockInHand: s.soh,
        fill: getColor(stockRatio)
      };
    });
    
    barData.sort((a, b) => a['Stock Ratio (%)'] - b['Stock Ratio (%)']);

    return (
      <div className="card animate-in" style={{ padding: 24, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ textAlign: 'left' }}>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Stock Level by {entityLabel}</h4>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 14, fontWeight: 700 }}>
            <span style={{ color: '#adb5bd' }}>No Stock: 0%</span>
            <span style={{ color: '#ff6b6b' }}>Critical: 1-30%</span>
            <span style={{ color: '#fcc419' }}>Warning: 31-59%</span>
            <span style={{ color: '#20c997' }}>OK: 60%+</span>
          </div>
        </div>
        <div style={{ width: '100%', flex: 1, minHeight: 400 }}>
          <ResponsiveContainer>
            <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} tick={{ fontSize: 12, fontWeight: 500, fill: 'var(--text-secondary)' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(0,0,0,0.03)' }} 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ backgroundColor: '#fff', padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 700, fontSize: 14, color: 'var(--primary-dark)' }}>{label}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span>Stock Ratio:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data['Stock Ratio (%)']}%</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span>Planogram:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.planogram.toLocaleString()}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                            <span>Stock in Hand:</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.stockInHand.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
              <Bar dataKey="Stock Ratio (%)" cursor="pointer" onClick={(data) => onClickHandler(data.name)} minPointSize={5} radius={[6, 6, 0, 0]} background={{ fill: 'rgba(0,0,0,0.02)', radius: [6, 6, 0, 0] }}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} style={{ transition: 'opacity 0.2s', outline: 'none' }} onMouseEnter={(e) => { e.target.style.opacity = 0.8; }} onMouseLeave={(e) => { e.target.style.opacity = 1; }} />
                ))}
                <LabelList dataKey="Stock Ratio (%)" position="top" formatter={(val) => `${val}%`} style={{ fontSize: 12, fontWeight: 700, fill: 'var(--text-primary)' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };


  // --- RENDER VIEWS ---

  if (loading) {
    return (
      <div className="animate-in">
        <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
          </div>
        </div>
        <div className="summary-grid">
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
          <div className="skeleton skeleton-card"></div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
          <div className="skeleton skeleton-chart" style={{ flex: 1 }}></div>
          <div className="skeleton skeleton-chart" style={{ flex: 1 }}></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        <h3>No Data Available</h3>
        <p>Please run the allocation engine first.</p>
      </div>
    );
  }

  const currentSummary = summarize(
    level === 'network' ? data :
    level === 'zones' ? data.filter(d => (d.zone || 'Unassigned') === selectedZone) :
    level === 'regions' ? data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion) :
    level === 'stores' ? data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion && d.store_name === selectedStore) :
    data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion && d.store_name === selectedStore && d.brand_name === selectedBrand)
  );

  const totalTarget = currentSummary.soh + currentSummary.deficit;
  const healthPercent = totalTarget > 0 ? (currentSummary.soh / totalTarget) * 100 : 100;
  const isDanger = totalTarget > 0 && healthPercent < 40;

  return (
    <div className="animate-in" style={{ paddingBottom: 120 }}>
      {/* HEADER & CONTROLS */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              Dashboard
            </h2>
          </div>
          
          <div className="breadcrumbs-path" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
            <span style={{ cursor: 'pointer', color: level === 'network' ? 'var(--text-primary)' : 'inherit', transition: 'color 0.2s', fontWeight: level === 'network' ? 700 : 500 }} onClick={() => { setLevel('network'); setSelectedZone(null); setSelectedRegion(null); setSelectedStore(null); setSelectedBrand(null); }}>National Network</span>
            
            {selectedZone && <>
              <span>›</span>
              <span style={{ cursor: 'pointer', color: level === 'zones' ? 'var(--text-primary)' : 'inherit', transition: 'color 0.2s', fontWeight: level === 'zones' ? 700 : 500 }} onClick={() => { setLevel('zones'); setSelectedRegion(null); setSelectedStore(null); setSelectedBrand(null); }}>{selectedZone}</span>
            </>}
            
            {selectedRegion && <>
              <span>›</span>
              <span style={{ cursor: 'pointer', color: level === 'regions' ? 'var(--text-primary)' : 'inherit', transition: 'color 0.2s', fontWeight: level === 'regions' ? 700 : 500 }} onClick={() => { setLevel('regions'); setSelectedStore(null); setSelectedBrand(null); }}>{selectedRegion}</span>
            </>}
            
            {selectedStore && <>
              <span>›</span>
              <span style={{ cursor: 'pointer', color: level === 'stores' ? 'var(--text-primary)' : 'inherit', transition: 'color 0.2s', fontWeight: level === 'stores' ? 700 : 500 }} onClick={() => { setLevel('stores'); setSelectedBrand(null); }}>{selectedStore}</span>
            </>}
            
            {selectedBrand && <>
              <span>›</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{selectedBrand}</span>
            </>}
          </div>
        </div>
      </div>

      {getMetricCards(currentSummary)}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, marginBottom: 24, alignItems: 'stretch' }}>
        {/* Left Column: Pie Chart */}
        <div>
          {renderDualCharts(currentSummary)}
        </div>

        {/* Right Column: Drill Down Graph */}
        <div>
          {level === 'network' && (
            renderDrillDownGraph('Zone', data.reduce((acc, i) => {
              const z = i.zone || 'Unassigned';
              if (!acc[z]) acc[z] = [];
              acc[z].push(i);
              return acc;
            }, {}), (name) => {
              setSelectedZone(name);
              setLevel('zones');
            })
          )}

          {level === 'zones' && (
            renderDrillDownGraph('Region', data.filter(d => (d.zone || 'Unassigned') === selectedZone).reduce((acc, i) => {
              const r = i.region || 'Unassigned';
              if (!acc[r]) acc[r] = [];
              acc[r].push(i);
              return acc;
            }, {}), (name) => {
              setSelectedRegion(name);
              setLevel('regions');
            })
          )}

          {level === 'regions' && (
            renderDrillDownGraph('Store', data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion).reduce((acc, i) => {
              const s = i.store_name || 'Unassigned';
              if (!acc[s]) acc[s] = [];
              acc[s].push(i);
              return acc;
            }, {}), (name) => {
              setSelectedStore(name);
              setLevel('stores');
            })
          )}
          {level === 'stores' && (
            renderDrillDownGraph('Brand', data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion && (d.store_name || 'Unassigned') === selectedStore).reduce((acc, i) => {
              const b = i.brand_name || 'Unassigned';
              if (!acc[b]) acc[b] = [];
              acc[b].push(i);
              return acc;
            }, {}), (name) => {
              setSelectedBrand(name);
              setLevel('brands');
            })
          )}

          {level === 'brands' && (
            renderDrillDownGraph('Commodity', data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion && (d.store_name || 'Unassigned') === selectedStore && (d.brand_name || 'Unassigned') === selectedBrand).reduce((acc, i) => {
              const c = i.commodity || 'Unassigned';
              if (!acc[c]) acc[c] = [];
              acc[c].push(i);
              return acc;
            }, {}), (name) => {
              // No-op for now
            })
          )}
        </div>
      </div>
    </div>
  );
}
