import re

with open("src/pages/DashboardPage.jsx", "r") as f:
    content = f.read()

# Replace title
content = content.replace("<h2>Allocation Report</h2>", "<h2>Dispatch Order Pick-List</h2>")
content = content.replace("<p>OptiFlow Similar-Item Engine processed {(summary.total_items_allocated || 0).toLocaleString()} items across {(summary.stores_with_deficits || 0).toLocaleString()} stores with active deficits.</p>", "<p>Review and print warehouse pick-lists grouped by your preferred hierarchy.</p>")

# Replace export API
content = content.replace("http://localhost:8000/api/allocation/results/export", "http://localhost:8000/api/dispatch/export")
content = content.replace("⬇ Download Filtered CSV", "⬇ Download Dispatch CSV")

# Replace headers
header_old = """                    <th>Store</th>
                    <th>Cat</th>
                    <th>Brand</th>
                    <th>Gaps</th>
                    <th>Target SKU</th>
                    <th>Allocated SKU</th>
                    <th>Qty</th>
                    <th>Region</th>
                    <th>Match Type</th>
                    <th>Reasoning / Warnings</th>"""
header_new = """                    <th>Allocated SKU</th>
                    <th>Item Specification</th>
                    <th>Store / Brand</th>
                    <th>Qty</th>
                    <th>MRP</th>"""
content = content.replace(header_old, header_new)
content = content.replace("colSpan={10}", "colSpan={5}")

# Replace table row
row_old = """                                    <td style={{ paddingLeft: 48, color: 'var(--text-secondary)' }}>—</td>
                                    <td><span className="badge badge-category">{row.store_category}</span></td>
                                    <td>{row.brand_name}</td>
                                    <td>{row.deficit}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{row.requested_item_code || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                      <span style={{ background: 'rgba(214, 168, 0, 0.12)', color: 'var(--gold-dark)', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                                        {row.allocated_item_code || '—'}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{row.allocated_qty || '—'}</td>
                                    <td style={{ fontSize: 13 }}>{row.region ? row.region.replace('_', ' ') : '—'}</td>
                                    <td>{matchBadge(row.match_type)}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {row.color_limit_warning && (
                                        <span style={{ color: 'var(--danger)', fontWeight: 600, marginRight: 8 }}>⚠️ Max 2 colors</span>
                                      )}
                                      {row.match_reason}
                                    </td>"""

row_new = """                                    <td style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, paddingLeft: 24 }}>
                                      <span style={{ background: 'rgba(214, 168, 0, 0.12)', color: 'var(--gold-dark)', padding: '4px 8px', borderRadius: 6 }}>
                                        {row.allocated_item_code || '—'}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: 13 }}>{row.allocated_item_name || 'No available stock'}</td>
                                    <td>
                                      <div style={{ fontSize: 12, fontWeight: 600 }}>{row.store_name}</div>
                                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.brand_name}</div>
                                    </td>
                                    <td style={{ fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>{row.allocated_qty || '—'}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{row.mrp > 0 ? `₹${row.mrp.toLocaleString()}` : '—'}</td>"""
content = content.replace(row_old, row_new)

# Second row variant
row_old2 = """                                    <td style={{ fontWeight: 600 }}>
                                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/store/${encodeURIComponent(row.store_name)}`)} style={{ padding: 0, color: 'var(--primary)', textDecoration: 'underline' }}>
                                        {row.store_name}
                                      </button>
                                    </td>
                                    <td><span className="badge badge-category">{row.store_category}</span></td>
                                    <td style={{ paddingLeft: 24, color: 'var(--text-secondary)' }}>—</td>
                                    <td>{row.deficit}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)' }}>{row.requested_item_code || '—'}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>
                                      <span style={{ background: 'rgba(214, 168, 0, 0.12)', color: 'var(--gold-dark)', padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>
                                        {row.allocated_item_code || '—'}
                                      </span>
                                    </td>
                                    <td style={{ fontWeight: 700 }}>{row.allocated_qty || '—'}</td>
                                    <td style={{ fontSize: 13 }}>{row.region ? row.region.replace('_', ' ') : '—'}</td>
                                    <td>{matchBadge(row.match_type)}</td>
                                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                      {row.color_limit_warning && (
                                        <span style={{ color: 'var(--danger)', fontWeight: 600, marginRight: 8 }}>⚠️ Max 2 colors</span>
                                      )}
                                      {row.match_reason}
                                    </td>"""
content = content.replace(row_old2, row_new)

# Change export default class name
content = content.replace("export default function DashboardPage()", "export default function DispatchPage()")

with open("src/pages/DispatchPage.jsx", "w") as f:
    f.write(content)
