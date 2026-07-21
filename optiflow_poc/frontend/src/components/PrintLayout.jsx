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

  const getKPIs = (items) => {
    const expectedMap = {};
    let allocated = 0;
    items.forEach(i => {
      expectedMap[i.gap_id] = (i.facing || 0) + (i.back_stock || 0);
      allocated += i.allocated_qty;
    });
    const expected = Object.values(expectedMap).reduce((a, b) => a + b, 0);
    const fulfill = expected > 0 ? Math.round((allocated / expected) * 100) : 0;
    return { expected, allocated, fulfill };
  };

  return (
    <div className="print-layout-container">
      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{title}</h1>
        <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>{subtitle}</p>
        <hr style={{ marginTop: 16, borderColor: '#ccc' }} />
      </div>
      
      {Object.keys(groups).sort().map(primaryKey => {
        const primaryGroup = groups[primaryKey];
        const primaryItems = Object.values(primaryGroup.subGroups).flat();
        const pKPIs = getKPIs(primaryItems);
        return (
          <div key={primaryKey} style={{ marginBottom: 30, pageBreakInside: 'avoid' }}>
            <div style={{ background: '#f1f3f5', padding: '8px 12px', borderLeft: '4px solid var(--primary)', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{primaryKey}</h2>
                  {groupBy === 'store' && primaryGroup.zone && (
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                      {primaryGroup.zone} &bull; {primaryGroup.region} &bull; Grade {primaryGroup.category}
                    </div>
                  )}
                </div>
                {!isDispatch && (
                  <div style={{ textAlign: 'right', fontSize: 12 }}>
                    <strong>Expected:</strong> {pKPIs.expected.toLocaleString()} &bull; <strong>Allocated:</strong> {pKPIs.allocated.toLocaleString()} &bull; <strong>Fulfillment:</strong> {pKPIs.fulfill}%
                  </div>
                )}
              </div>
            </div>
            
            {Object.keys(primaryGroup.subGroups).sort().map(subKey => {
              const skus = primaryGroup.subGroups[subKey];
              const sKPIs = getKPIs(skus);
              skus.sort((a, b) => b.allocated_qty - a.allocated_qty);
              
              return (
                <div key={subKey} style={{ marginBottom: 16, paddingLeft: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#333' }}>
                      {subKey}
                    </h3>
                    {!isDispatch && (
                      <div style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>
                        Exp: {sKPIs.expected.toLocaleString()} | Alloc: {sKPIs.allocated.toLocaleString()} | Rate: {sKPIs.fulfill}%
                      </div>
                    )}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #ccc', color: '#666', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px', width: isDispatch ? '15%' : '15%' }}>{isDispatch ? 'Allocated SKU' : 'Target SKU'}</th>
                        <th style={{ padding: '6px 8px', width: isDispatch ? '55%' : '15%' }}>{isDispatch ? 'Item Description' : 'Allocated SKU'}</th>
                        {!isDispatch && <th style={{ padding: '6px 8px', width: '10%' }}>Match</th>}
                        <th style={{ padding: '6px 8px', width: '10%' }}>{isDispatch ? 'Dispatch Qty' : 'Allocated Qty'}</th>
                        {!isDispatch && <th style={{ padding: '6px 8px', width: '50%' }}>Reasoning</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {skus.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f1f1' }}>
                          <td style={{ padding: '6px 8px', fontWeight: 600 }}>
                            {isDispatch ? (item.allocated_item_code || "-") : (item.requested_item_code || "-")}
                          </td>
                          <td style={{ padding: '6px 8px', color: isDispatch ? '#444' : 'var(--primary)', fontWeight: isDispatch ? 'normal' : 600 }}>
                            {isDispatch ? (item.allocated_item_name || "-") : (item.allocated_item_code || "-")}
                          </td>
                          {!isDispatch && (
                            <td style={{ padding: '6px 8px' }}>
                              <span style={{ 
                                fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                                background: item.match_type?.toLowerCase() === 'exact' ? 'rgba(46,204,113,0.15)' : item.match_type?.toLowerCase() === 'similar' ? 'rgba(52,152,219,0.15)' : 'rgba(241,196,15,0.15)',
                                color: item.match_type?.toLowerCase() === 'exact' ? '#059669' : item.match_type?.toLowerCase() === 'similar' ? '#2563eb' : '#d97706'
                              }}>
                                {item.match_type?.toUpperCase() || '-'}
                              </span>
                            </td>
                          )}
                          <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--primary)' }}>{item.allocated_qty}</td>
                          {!isDispatch && <td style={{ padding: '6px 8px', fontSize: 10, color: '#666' }}>{item.match_reason || "-"}</td>}
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
