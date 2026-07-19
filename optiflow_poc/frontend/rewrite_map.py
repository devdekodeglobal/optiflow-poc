import re

with open("src/pages/AllocationDashboardPage.jsx", "r") as f:
    content = f.read()

# Add expandedZones state
state_marker = "const [brandExpanded, setBrandExpanded] = useState(true);"
state_addition = "\n  const [expandedZones, setExpandedZones] = useState({ 'North India': true, 'West India': true, 'South India': true, 'East India': true, 'Corporate': true, 'Unassigned Zone': true });"
content = content.replace(state_marker, state_marker + state_addition)

# Find the Regional Health Map section
start_marker = "<div className=\"card animate-in\" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>\n        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>\n          <h3 style={{ margin: 0 }}>Regional Health Map</h3>"
end_marker = "<div className=\"card animate-in\" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>\n        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>\n          <h3 style={{ margin: 0 }}>Deep Dives</h3>"

if start_marker in content and end_marker in content:
    idx_start = content.find(start_marker)
    idx_end = content.find(end_marker)
    
    new_map_jsx = """<div className="card animate-in" style={{ marginTop: 24, padding: 0, overflow: 'hidden' }}>
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
      
      """
    
    new_content = content[:idx_start] + new_map_jsx + content[idx_end:]
    
    with open("src/pages/AllocationDashboardPage.jsx", "w") as f:
        f.write(new_content)
    print("Map updated successfully!")
else:
    print("Map markers not found!")

