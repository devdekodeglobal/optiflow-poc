import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = {
  fulfilled: 'rgba(46,204,113,0.85)',
  outOfStock: 'rgba(231,76,60,0.85)',
  soh: 'rgba(52,152,219,0.85)',
  deficit: 'rgba(241,196,15,0.85)',
};

const BREAKDOWN_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1'
];

export default function OverallDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Drill-down state
  const [level, setLevel] = useState('network'); // 'network', 'zones', 'regions', 'stores'
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [metricFilter, setMetricFilter] = useState(null); // 'Fulfilled', 'Out of Stock', 'Stock in Hand', 'Planogram Deficit'

  useEffect(() => {
    fetch('http://localhost:8000/api/allocation/results?page_size=50000')
      .then(res => res.json())
      .then(json => {
        setData(json.allocations || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const summarize = (items) => {
    const uniqueGapsMap = {};
    const uniqueSohMap = {};
    items.forEach(i => { 
      if (i.gap_id) {
        uniqueGapsMap[i.gap_id] = i.deficit || 0; 
        uniqueSohMap[i.gap_id] = i.current_soh || 0;
      }
    });
    const deficit = Object.values(uniqueGapsMap).reduce((a, b) => a + b, 0);
    const soh = Object.values(uniqueSohMap).reduce((a, b) => a + b, 0);
    const allocated = items.reduce((a, b) => a + (b.allocated_qty || 0), 0);
    const outOfStock = Math.max(0, deficit - allocated);
    return { soh, deficit, allocated, outOfStock };
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
    const fulfillPct = summary.deficit > 0 ? (summary.allocated / summary.deficit) * 100 : 100;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr', gap: 16, marginBottom: 24, alignItems: 'stretch' }}>
        <FulfillmentGauge pct={fulfillPct} />
        <div className="summary-card info">
          <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>STOCK IN HAND</h4>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{summary.soh.toLocaleString()}</div>
        </div>
        <div className="summary-card warning">
          <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>TOTAL DEFICIT</h4>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{summary.deficit.toLocaleString()}</div>
        </div>
        <div className="summary-card success">
          <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>FULFILLED</h4>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: 'var(--success)' }}>{summary.allocated.toLocaleString()}</div>
        </div>
        <div className="summary-card danger">
          <h4 style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>OUT OF STOCK</h4>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: 'var(--danger)' }}>{summary.outOfStock.toLocaleString()}</div>
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
      { name: 'Stock in Hand', value: summary.soh, color: COLORS.soh },
      { name: 'Planogram Deficit', value: summary.deficit, color: COLORS.deficit }
    ];

    const handlePieClick = (data) => {
      if (metricFilter === data.name) {
        setMetricFilter(null); // Toggle off
      } else {
        setMetricFilter(data.name); // Toggle on
      }
    };

    const getPieStyle = (name) => ({
      cursor: 'pointer',
      opacity: metricFilter === name ? 1 : (metricFilter ? 0.3 : 1),
      stroke: metricFilter === name ? 'var(--bg-card)' : 'none',
      strokeWidth: 2
    });

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
      const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
      if (percent < 0.05) return null;
      return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" style={{ fontSize: 13, fontWeight: 700, pointerEvents: 'none' }}>
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    };

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <h4>Fulfillment vs Out of Stock</h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click a slice to filter the drill-down chart below.</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={fulfillData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} onClick={handlePieClick} label={renderCustomizedLabel} labelLine={false}>
                  {fulfillData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={getPieStyle(entry.name)} />)}
                </Pie>
                <Tooltip formatter={(val) => val.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <h4>Stock vs Planogram Deficit</h4>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Click a slice to filter the drill-down chart below.</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stockData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} onClick={handlePieClick} label={renderCustomizedLabel} labelLine={false}>
                  {stockData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} style={getPieStyle(entry.name)} />)}
                </Pie>
                <Tooltip formatter={(val) => val.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderDrillDownGraph = (title, itemsMap, onClickHandler) => {
    const barData = Object.keys(itemsMap).map((key) => {
      const s = summarize(itemsMap[key]);
      return {
        name: key,
        Fulfilled: s.allocated,
        'Out of Stock': s.outOfStock,
        'Stock in Hand': s.soh,
        'Planogram Deficit': s.deficit
      };
    });
    
    if (metricFilter) {
      barData.sort((a, b) => b[metricFilter] - a[metricFilter]);
    } else {
      barData.sort((a, b) => (b.Fulfilled + b['Out of Stock']) - (a.Fulfilled + a['Out of Stock']));
    }

    return (
      <div className="card animate-in" style={{ padding: 24, textAlign: 'center' }}>
        <h4 style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
          {title} 
          {metricFilter && <span style={{ background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>Filtering: {metricFilter}</span>}
        </h4>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Click any bar to drill down to the next level.</p>
        <div style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} interval={0} />
              <YAxis />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Legend verticalAlign="top" height={36}/>
              {(!metricFilter || metricFilter === 'Fulfilled') && <Bar dataKey="Fulfilled" fill={COLORS.fulfilled} stackId={metricFilter ? undefined : 'a'} cursor="pointer" onClick={(data) => onClickHandler(data.name)} minPointSize={10} />}
              {(!metricFilter || metricFilter === 'Out of Stock') && <Bar dataKey="Out of Stock" fill={COLORS.outOfStock} stackId={metricFilter ? undefined : 'a'} cursor="pointer" onClick={(data) => onClickHandler(data.name)} minPointSize={10} />}
              {(metricFilter === 'Stock in Hand') && <Bar dataKey="Stock in Hand" fill={COLORS.soh} cursor="pointer" onClick={(data) => onClickHandler(data.name)} minPointSize={10} />}
              {(metricFilter === 'Planogram Deficit') && <Bar dataKey="Planogram Deficit" fill={COLORS.deficit} cursor="pointer" onClick={(data) => onClickHandler(data.name)} minPointSize={10} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderUrgencyLeaderboard = (itemsMap, entityLabel) => {
    const ranked = Object.keys(itemsMap).map((key) => {
      const summary = summarize(itemsMap[key]);
      const oosRatio = summary.deficit > 0 ? (summary.outOfStock / summary.deficit) * 100 : 0;
      return { name: key, oosRatio, ...summary };
    }).filter(r => r.deficit > 0).sort((a, b) => b.oosRatio - a.oosRatio).slice(0, 8);

    if (ranked.length === 0) return null;

    const getColor = (ratio) => {
      if (ratio >= 60) return { bar: 'var(--danger)', bg: 'rgba(231,76,60,0.08)', badge: '#e74c3c', label: 'Critical' };
      if (ratio >= 30) return { bar: 'var(--gold)', bg: 'rgba(241,196,15,0.08)', badge: '#f39c12', label: 'Warning' };
      return { bar: 'var(--success)', bg: 'rgba(46,204,113,0.08)', badge: '#27ae60', label: 'OK' };
    };

    const getDispatchUrl = (name) => {
      const params = new URLSearchParams();
      if (level === 'network') params.set('zone', name);
      else if (level === 'zones') { params.set('zone', selectedZone); params.set('region', name); }
      else if (level === 'regions') { params.set('zone', selectedZone); params.set('region', selectedRegion); params.set('store_name', name); }
      return `/dispatch?${params.toString()}`;
    };

    const getDrillHandler = (name) => {
      if (level === 'network') { setSelectedZone(name); setLevel('zones'); setMetricFilter(null); }
      else if (level === 'zones') { setSelectedRegion(name); setLevel('regions'); setMetricFilter(null); }
      else if (level === 'regions') { setSelectedStore(name); setLevel('stores'); setMetricFilter(null); }
    };

    return (
      <div className="card animate-in" style={{ padding: 20, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: 14 }}>🚨 Top {entityLabel}s by OOS Severity</h4>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% deficit unfulfilled · click row to drill down</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ranked.map((r, idx) => {
            const c = getColor(r.oosRatio);
            const isDrillable = level !== 'stores';
            return (
              <div
                key={idx}
                onClick={isDrillable ? () => getDrillHandler(r.name) : undefined}
                style={{ background: c.bg, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 12, cursor: isDrillable ? 'pointer' : 'default' }}
              >
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: c.badge, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, flexShrink: 0 }}>{idx + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{r.name}</div>
                  <div style={{ position: 'relative', height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${r.oosRatio}%`, background: c.bar, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 52 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: c.badge }}>{Math.round(r.oosRatio)}%</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.label}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(getDispatchUrl(r.name)); }}
                  style={{ background: c.badge, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  Dispatch
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- RENDER VIEWS ---

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }}></div>
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
    data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion && d.store_name === selectedStore)
  );

  const totalTarget = currentSummary.soh + currentSummary.deficit;
  const healthPercent = totalTarget > 0 ? (currentSummary.soh / totalTarget) * 100 : 100;
  const isDanger = totalTarget > 0 && healthPercent < 40;

  return (
    <div className="animate-in" style={{ paddingBottom: 120 }}>
      {/* HEADER & CONTROLS */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 0 }}>
            {level === 'network' && 'Dashboard'}
            {level === 'zones' && `Zone: ${selectedZone}`}
            {level === 'regions' && `Region: ${selectedRegion}`}
            {level === 'stores' && `Store: ${selectedStore}`}
          </h2>
          <div className="breadcrumbs" style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
            <button className={`btn btn-sm ${level === 'network' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setLevel('network'); setSelectedZone(null); setSelectedRegion(null); setSelectedStore(null); setMetricFilter(null); }}>Global</button>
            {selectedZone && <button className={`btn btn-sm ${level === 'zones' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setLevel('zones'); setSelectedRegion(null); setSelectedStore(null); setMetricFilter(null); }}>{selectedZone}</button>}
            {selectedRegion && <button className={`btn btn-sm ${level === 'regions' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => { setLevel('regions'); setSelectedStore(null); setMetricFilter(null); }}>{selectedRegion}</button>}
            {selectedStore && <button className={`btn btn-sm ${level === 'stores' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setLevel('stores')}>{selectedStore}</button>}
          </div>
        </div>
        
        {level !== 'network' && (
          <button className="btn btn-primary animate-in" onClick={handleDispatchAction} style={{ background: 'var(--gold)', color: 'var(--bg-app)', border: 'none', padding: '10px 20px', fontWeight: 700 }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: 6, verticalAlign: 'text-bottom' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Generate Dispatch Order
          </button>
        )}
      </div>

      {isDanger && (
        <div className="animate-in" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, background: '#fff', borderLeft: '4px solid var(--danger)', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, maxWidth: 350 }}>
          <div style={{ color: 'var(--danger)' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Low Inventory Alert</h4>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Stock at {Math.round(healthPercent)}% of target.
            </p>
          </div>
          <button className="btn btn-sm" onClick={handleDispatchAction} style={{ background: 'rgba(231,76,60,0.1)', color: 'var(--danger)', border: 'none', fontWeight: 700, padding: '6px 12px' }}>
            Dispatch
          </button>
        </div>
      )}

      {getMetricCards(currentSummary)}
      {renderDualCharts(currentSummary)}

      {/* DRILL DOWN VIEWS */}
      {level === 'network' && (
        renderDrillDownGraph('Deficit Breakdown by Zone', data.reduce((acc, i) => {
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
        renderDrillDownGraph(`Deficit Breakdown by Region (${selectedZone})`, data.filter(d => (d.zone || 'Unassigned') === selectedZone).reduce((acc, i) => {
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
        renderDrillDownGraph(`Deficit Breakdown by Store (${selectedRegion})`, data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion).reduce((acc, i) => {
          const s = i.store_name || 'Unassigned';
          if (!acc[s]) acc[s] = [];
          acc[s].push(i);
          return acc;
        }, {}), (name) => {
          setSelectedStore(name);
          setLevel('stores');
        })
      )}

      {/* Urgency Leaderboard — drill-down aware */}
      {level === 'network' && renderUrgencyLeaderboard(
        data.reduce((acc, i) => { const z = i.zone || 'Unassigned'; if (!acc[z]) acc[z] = []; acc[z].push(i); return acc; }, {}),
        'Zone'
      )}
      {level === 'zones' && selectedZone && renderUrgencyLeaderboard(
        data.filter(d => (d.zone || 'Unassigned') === selectedZone).reduce((acc, i) => { const r = i.region || 'Unassigned'; if (!acc[r]) acc[r] = []; acc[r].push(i); return acc; }, {}),
        'Region'
      )}
      {level === 'regions' && selectedRegion && renderUrgencyLeaderboard(
        data.filter(d => (d.zone || 'Unassigned') === selectedZone && (d.region || 'Unassigned') === selectedRegion).reduce((acc, i) => { const s = i.store_name || 'Unassigned'; if (!acc[s]) acc[s] = []; acc[s].push(i); return acc; }, {}),
        'Store'
      )}
      
      {level === 'stores' && (
        <div className="card animate-in" style={{ padding: 40, textAlign: 'center' }}>
          <h3>Store Action Required</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>You are viewing detailed metrics for {selectedStore}. Click the button below to review and print the dispatch order.</p>
          <button className="btn btn-primary" onClick={handleDispatchAction} style={{ background: 'var(--gold)', color: 'var(--bg-app)', border: 'none', padding: '12px 24px', fontSize: 16 }}>
            Proceed to Dispatch Queue ➔
          </button>
        </div>
      )}
    </div>
  );
}
