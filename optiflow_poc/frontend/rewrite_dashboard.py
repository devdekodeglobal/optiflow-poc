import re

with open("src/pages/AllocationDashboardPage.jsx", "r") as f:
    content = f.read()

# We need to replace the pie charts with Stat cards.
# Finding the block from <div style={{ display: 'grid'... > down to just before <div className="card animate-in"... Tier Fulfillment

start_marker = "<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 24 }}>"
end_marker = "<div className=\"card animate-in\" style={{ padding: 24, gridColumn: '1 / -1' }}>\n          <h3 style={{ marginBottom: 16 }}>Tier Fulfillment"

if start_marker in content and end_marker in content:
    idx_start = content.find(start_marker)
    idx_end = content.find(end_marker)
    
    # Calculate some stats to use
    stat_cards_jsx = """
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
        """
        
    new_content = content[:idx_start] + stat_cards_jsx + content[idx_end:]
    
    # Also add labels to Tier Fulfillment chart
    new_content = new_content.replace(
        "<h3 style={{ marginBottom: 16 }}>Tier Fulfillment (by Unit)</h3>",
        "<h3 style={{ marginBottom: 4 }}>Tier Fulfillment (by Unit)</h3>\n          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Shows how many requested items could not be fulfilled due to warehouse stock-outs, broken down by Store Grade. OptiFlow prioritizes A++ stores first.</p>"
    )
    # Add LabelList to Tier bars
    new_content = new_content.replace(
        """import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';""",
        """import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';"""
    )
    new_content = new_content.replace(
        """<Bar dataKey="unresolved" stackId="a" fill="var(--danger)" name="Unresolved" radius={[4, 4, 0, 0]} />""",
        """<Bar dataKey="unresolved" stackId="a" fill="var(--danger)" name="Unresolved" radius={[4, 4, 0, 0]}>\n                  <LabelList dataKey="unresolved" position="top" style={{ fontSize: 11, fill: 'var(--danger)', fontWeight: 600 }} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />\n                </Bar>"""
    )
    new_content = new_content.replace(
        """<Bar dataKey="filled" stackId="a" fill="var(--primary)" name="Filled" radius={[0, 0, 4, 4]} barSize={60} />""",
        """<Bar dataKey="filled" stackId="a" fill="var(--primary)" name="Filled" radius={[0, 0, 4, 4]} barSize={60}>\n                  <LabelList dataKey="filled" position="center" style={{ fontSize: 12, fill: '#fff', fontWeight: 700 }} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />\n                </Bar>"""
    )

    # Add labels to Network Brand Breakdown
    new_content = new_content.replace(
        "<h3 style={{ marginBottom: 16 }}>Network Brand Breakdown (by Unit)</h3>",
        "<h3 style={{ marginBottom: 4 }}>Network Brand Breakdown (by Unit)</h3>\n          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>Overview of which brands were successfully allocated versus which brands had stock shortages.</p>"
    )

    new_content = new_content.replace(
        """<Bar dataKey="out_of_stock" stackId="a" fill="var(--danger)" name="Out of Stock" radius={[0, 4, 4, 0]} />""",
        """<Bar dataKey="out_of_stock" stackId="a" fill="var(--danger)" name="Out of Stock" radius={[0, 4, 4, 0]}>\n                    <LabelList dataKey="out_of_stock" position="right" style={{ fontSize: 11, fill: 'var(--danger)', fontWeight: 600 }} formatter={(v) => v > 0 ? v.toLocaleString() : ''} />\n                  </Bar>"""
    )

    with open("src/pages/AllocationDashboardPage.jsx", "w") as f:
        f.write(new_content)
    print("Dashboard updated successfully!")
else:
    print("Markers not found!")

