import React from 'react';

export default function PrintLayout({ data, isDispatch, title, subtitle, groupBy = 'store' }) {
  if (!data || data.length === 0) return null;

  let groups = {};
  
  if (groupBy === 'store') {
    data.forEach(item => {
      if (!groups[item.store_name]) {
        groups[item.store_name] = {
          zone: item.zone,
          region: item.region,
          category: item.store_category,
          subGroups: {}
        };
      }
      if (!groups[item.store_name].subGroups[item.brand_name]) {
        groups[item.store_name].subGroups[item.brand_name] = [];
      }
      groups[item.store_name].subGroups[item.brand_name].push(item);
    });
  } else if (groupBy === 'brand') {
    data.forEach(item => {
      if (!groups[item.brand_name]) {
        groups[item.brand_name] = { subGroups: {} };
      }
      if (!groups[item.brand_name].subGroups[item.store_name]) {
        groups[item.brand_name].subGroups[item.store_name] = [];
      }
      groups[item.brand_name].subGroups[item.store_name].push(item);
    });
  }

  return (
    <div className="print-layout-container">
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{title}</h1>
        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>{subtitle}</p>
        <hr style={{ marginTop: 16, borderColor: '#ccc' }} />
      </div>
      
      {Object.keys(groups).sort().map(primaryKey => {
        const primaryGroup = groups[primaryKey];
        return (
          <div key={primaryKey} style={{ marginBottom: 30, pageBreakInside: 'avoid' }}>
            <div style={{ background: '#f1f3f5', padding: '8px 12px', borderLeft: '4px solid var(--primary)', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{primaryKey}</h2>
              {groupBy === 'store' && primaryGroup.zone && (
                <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                  {primaryGroup.zone} &bull; {primaryGroup.region} &bull; Grade {primaryGroup.category}
                </div>
              )}
            </div>
            
            {Object.keys(primaryGroup.subGroups).sort().map(subKey => {
              const skus = primaryGroup.subGroups[subKey];
              skus.sort((a, b) => b.allocated_qty - a.allocated_qty);
              
              return (
                <div key={subKey} style={{ marginBottom: 16, paddingLeft: 12 }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 700, color: '#333', borderBottom: '1px solid #eee', paddingBottom: 4 }}>
                    {subKey}
                  </h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #ccc', color: '#666', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px', width: '15%' }}>Allocated SKU</th>
                        <th style={{ padding: '6px 8px', width: '55%' }}>Item Description</th>
                        {!isDispatch && <th style={{ padding: '6px 8px', width: '10%' }}>Expected</th>}
                        <th style={{ padding: '6px 8px', width: '10%' }}>{isDispatch ? 'Dispatch Qty' : 'Allocated'}</th>
                        {!isDispatch && <th style={{ padding: '6px 8px', width: '10%' }}>Deficit</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {skus.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>{item.allocated_item_code || "-"}</td>
                          <td style={{ padding: '6px 8px', color: '#444' }}>{item.allocated_item_name || "-"}</td>
                          {!isDispatch && <td style={{ padding: '6px 8px' }}>{item.expected_qty}</td>}
                          <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--primary)' }}>{item.allocated_qty}</td>
                          {!isDispatch && (
                            <td style={{ padding: '6px 8px', color: item.expected_qty - item.allocated_qty > 0 ? 'var(--critical)' : 'inherit' }}>
                              {item.expected_qty - item.allocated_qty}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
