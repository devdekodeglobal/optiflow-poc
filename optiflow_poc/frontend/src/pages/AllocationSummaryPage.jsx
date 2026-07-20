import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllocationSummary, getStores, getBrands, getRegions } from '../api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

export default function AllocationSummaryPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [storeList, setStoreList] = useState([]);
  const [brandList, setBrandList] = useState([]);
  const [regionList, setRegionList] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [brandExpanded, setBrandExpanded] = useState(true);
  const [expandedZones, setExpandedZones] = useState({ 'North India': true, 'West India': true, 'South India': true, 'East India': true, 'Corporate': true, 'Unassigned Zone': true });

  const fetchSummary = useCallback(async () => {
    try {
      const data = await getAllocationSummary();
      if (data.status === 'ready') {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  }, []);

  const fetchLists = useCallback(async () => {
    try {
      const [sRes, bRes, rRes] = await Promise.all([getStores(), getBrands(), getRegions()]);
      setStoreList(sRes.stores || []);
      setBrandList(bRes.brands || []);
      setRegionList(rRes.regions || []);
    } catch (err) {
      console.error('Failed to fetch lists:', err);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchLists();
  }, [fetchSummary, fetchLists]);

  if (!summary) {
    return (
      <div>
        <div className="page-header">
          <h2>Allocation Dashboard</h2>
          <p>Run the allocation engine from the Upload page first.</p>
        </div>
        <div className="empty-state card">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <h3>No Allocation Data</h3>
          <p>Upload planograms and live stock to generate recommendations.</p>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => navigate('/')}>
            Go to Ingestion
          </button>
        </div>
      </div>
    );
  }

  const matchData = [
    { name: 'Exact', value: summary.exact_matches, color: 'var(--success)' },
    { name: 'Similar', value: summary.similar_matches, color: 'var(--primary)' },
    { name: 'Fallback', value: summary.brand_fallbacks, color: 'var(--warning-dark)' },
    { name: 'Unresolved', value: summary.unresolved, color: 'var(--danger)' },
  ].filter(d => d.value > 0);

  const storeData = [
    { name: 'Fully Stocked', value: Math.max(0, (summary.total_stores || 0) - (summary.stores_with_deficits || 0)), color: 'var(--success)' },
    { name: 'Needs Stock', value: summary.stores_with_deficits || 0, color: 'var(--danger)' }
  ].filter(d => d.value > 0);

  const itemData = [
    { name: 'Filled Units', value: summary.total_items_allocated || 0, color: 'var(--primary)' },
    { name: 'Still Short', value: Math.max(0, (summary.total_target_deficit || 0) - (summary.total_items_allocated || 0)), color: 'var(--warning-dark)' }
  ].filter(d => d.value > 0);

  const stockUtilizationData = [
    { name: 'Allocated to Stores', value: summary.total_items_allocated || 0, color: 'var(--primary)' },
    { name: 'Idle Warehouse Stock', value: Math.max(0, (summary.total_soh || 0) - (summary.total_items_allocated || 0)), color: 'var(--bg-surface)' }
  ].filter(d => d.value > 0);

  const tierData = ['A++', 'A+', 'A', 'B+', 'B', 'C']
    .filter(t => summary.tier_fulfillment && summary.tier_fulfillment[t] && summary.tier_fulfillment[t].target > 0)
    .map(t => ({
      name: t,
      target: summary.tier_fulfillment[t].target,
      filled: summary.tier_fulfillment[t].filled,
      unresolved: Math.max(0, summary.tier_fulfillment[t].target - summary.tier_fulfillment[t].filled)
    }));

  const brandChartData = (summary.brands || [])
    .sort((a, b) => b.deficit - a.deficit)
    .map(b => ({
      name: b.brand_name,
      filled: b.filled,
      out_of_stock: b.out_of_stock
    }));

  const brandChartHeight = Math.max(300, brandChartData.length * 40);

  return (
    <div>
      <div className="page-header animate-in">
        <h2>Allocation Dashboard</h2>
        <p>OptiFlow Similar-Item Engine processed {(summary.total_items_allocated || 0).toLocaleString()} items across {(summary.stores_with_deficits || 0).toLocaleString()} stores with active deficits.</p>
      </div>

      
      {/* STAT CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginTop: 24 }}>
        
        <div className="card animate-in" style={{ padding: 24, borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Total Units to Dispatch</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{(summary.total_items_allocated || 0).toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Physical boxes to pack and ship.</div>
        </div>

        <div className="card animate-in" style={{ padding: 24, borderLeft: '4px solid var(--success)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Total Retail Value</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--success)', marginBottom: 4 }}>₹{(summary.total_retail_value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Market value of fulfilled items.</div>
        </div>

        <div className="card animate-in" style={{ padding: 24, borderLeft: '4px solid var(--danger)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Out of Stock (Unfulfilled)</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--danger)', marginBottom: 4 }}>{Math.max(0, (summary.total_target_deficit || 0) - (summary.total_items_allocated || 0)).toLocaleString()}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Units needed but warehouse is empty.</div>
        </div>

        <div className="card animate-in" style={{ padding: 24, borderLeft: '4px solid var(--warning-dark)' }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Exact Match Quality</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--warning-dark)', marginBottom: 4 }}>
            {((summary.exact_matches || 0) + (summary.similar_matches || 0) + (summary.brand_fallbacks || 0)) > 0 
              ? Math.round((summary.exact_matches / ((summary.exact_matches || 0) + (summary.similar_matches || 0) + (summary.brand_fallbacks || 0))) * 100) 
              : 0}%
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Of shipments match requested SKU.</div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginTop: 24 }}>
        <div className="card animate-in" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 4 }}>Tier Fulfillment (by Unit)</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Shows how many requested items could not be fulfilled due to warehouse stock-outs, broken down by Store Grade. OptiFlow prioritizes A++ stores first.</p>
          <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <RechartsTooltip cursor={{fill: 'var(--bg-app)'}} formatter={(value) => `${value.toLocaleString()} units`} />
                <Legend />
                <Bar dataKey="filled" stackId="a" fill="var(--primary)" name="Filled" radius={[0, 0, 4, 4]} barSize={60}>
                  <LabelList dataKey="filled" position="center" style={{ fontSize: 12, fill: '#fff', fontWeight: 700 }} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                </Bar>
                <Bar dataKey="unresolved" stackId="a" fill="var(--danger)" name="Unresolved" radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="unresolved" position="top" style={{ fontSize: 11, fill: 'var(--danger)', fontWeight: 600 }} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card animate-in" style={{ padding: 24, gridColumn: '1 / -1' }}>
          <h3 style={{ marginBottom: 4 }}>Network Brand Breakdown (by Unit)</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Overview of which brands were successfully allocated versus which brands had stock shortages.</p>
          <div style={{ height: 400, overflowY: 'auto', overflowX: 'hidden', paddingRight: 8 }}>
            <div style={{ height: brandChartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandChartData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 600 }} width={120} />
                  <RechartsTooltip cursor={{fill: 'var(--bg-app)'}} formatter={(value) => `${value.toLocaleString()} units`} />
                  <Legend />
                  <Bar dataKey="filled" stackId="a" fill="var(--primary)" name="Filled Units" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="out_of_stock" stackId="a" fill="var(--danger)" name="Out of Stock" radius={[0, 4, 4, 0]}>
                    <LabelList dataKey="out_of_stock" position="right" style={{ fontSize: 11, fill: 'var(--danger)', fontWeight: 600 }} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      <div className="card animate-in" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <h3 style={{ margin: 0 }}>Regional Health Map (By Zone)</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Fulfillment percentage grouped by macro-geographical zones. Expand a zone to see the performance of specific regions.
          </p>
        </div>
        
        <div>
          {Object.entries(regionList.reduce((acc, region) => {
            const z = region.zone_name || 'Other';
            if (!acc[z]) acc[z] = [];
            acc[z].push(region);
            return acc;
          }, {})).map(([zoneName, regions]) => {
            const isExpanded = expandedZones[zoneName];
            
            // Format data for chart
            const chartData = regions.map(r => ({
              name: r.region_name.replace('_', ' '),
              fulfillment: r.fulfillment_pct,
              filled: r.total_filled,
              needed: r.total_deficit
            })).sort((a,b) => b.fulfillment - a.fulfillment);
            
            return (
              <div key={zoneName} style={{ borderBottom: '1px solid var(--border)' }}>
                <div 
                  onClick={() => setExpandedZones(prev => ({...prev, [zoneName]: !prev[zoneName]}))}
                  style={{ 
                    padding: '16px 24px', 
                    background: isExpanded ? 'rgba(59,35,123,0.02)' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 18, color: 'var(--text-muted)', width: 20 }}>
                      {isExpanded ? '−' : '+'}
                    </span>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{zoneName}</h4>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {regions.length} Regions
                  </div>
                </div>
                
                {isExpanded && (
                  <div style={{ padding: '20px 24px 32px 24px', background: 'var(--bg-app)' }}>
                    <div style={{ height: Math.max(150, regions.length * 45) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                          <XAxis type="number" domain={[0, 100]} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 600 }} width={140} />
                          <RechartsTooltip cursor={{fill: 'var(--bg-surface)'}} formatter={(value, name) => [name === 'fulfillment' ? `${value}%` : value.toLocaleString(), name === 'fulfillment' ? 'Fulfillment' : (name === 'filled' ? 'Stock Sent' : 'Needed')]} />
                          <Bar dataKey="fulfillment" radius={[0, 4, 4, 0]} barSize={20}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fulfillment >= 90 ? 'var(--success)' : entry.fulfillment >= 50 ? 'var(--warning-dark)' : 'var(--danger)'} />
                            ))}
                            <LabelList dataKey="fulfillment" position="right" style={{ fontSize: 12, fontWeight: 700 }} formatter={(v) => `${v}%`} fill="var(--text-primary)" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="card animate-in" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
          <h3 style={{ margin: 0 }}>Deep Dives</h3>
        </div>
        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
          
          <div style={{ background: 'var(--bg-app)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: 12 }}>Store Deep Dive</h4>
            <select 
              className="filter-select" 
              style={{ width: '100%', marginBottom: 16 }}
              onChange={(e) => {
                if (e.target.value) navigate(`/store/${encodeURIComponent(e.target.value)}`);
              }}
              defaultValue=""
            >
              <option value="" disabled>Select a store...</option>
              {storeList.map((s, idx) => (
                <option key={idx} value={s.store_name}>{s.store_name}</option>
              ))}
            </select>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>View specific KPIs, match types, and raw allocations for a single store.</p>
          </div>

          <div style={{ background: 'var(--bg-app)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: 12 }}>Brand Deep Dive</h4>
            <select 
              className="filter-select" 
              style={{ width: '100%', marginBottom: 16 }}
              onChange={(e) => {
                if (e.target.value) navigate(`/brand/${encodeURIComponent(e.target.value)}`);
              }}
              defaultValue=""
            >
              <option value="" disabled>Select a brand...</option>
              {brandList.map((b, idx) => (
                <option key={idx} value={b.brand_name}>{b.brand_name}</option>
              ))}
            </select>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>View specific KPIs, match types, and raw allocations for a single brand.</p>
          </div>

        </div>
      </div>



    </div>
  );
}
