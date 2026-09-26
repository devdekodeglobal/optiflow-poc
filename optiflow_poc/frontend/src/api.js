const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://optiflow-poc.onrender.com';

export async function uploadFile(endpoint, file) {
  // --- FRONTEND STATIC CACHE MODE ---
  await new Promise(r => setTimeout(r, 600));
  return {
    status: 'success',
    filename: file.name,
    rows: Math.floor(Math.random() * 50000) + 100000,
    stores: 92,
    warehouse_skus: 10570,
    warehouse_total_units: 53764
  };

  // --- BACKEND API CALLS (Commented off for frontend-only mode) ---
  /*
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
  */
}

export async function getUploadStatus() {
  const res = await fetch(`${API_BASE}/api/upload/status`);
  return res.json();
}

export async function runAllocation(lookbackDays = null) {
  // --- FRONTEND STATIC CACHE MODE ---
  try {
    const res = await fetch('/data/allocation_results.json').then(r => r.ok ? r.json() : null);
    if (res) {
      return {
        status: 'success',
        last_run_at: new Date().toISOString(),
        summary: res.summary,
        results: res.results
      };
    }
  } catch (e) {
    console.error('Failed to run allocation in static mode', e);
  }
  return { status: 'success', last_run_at: new Date().toISOString() };

  // --- BACKEND API CALLS (Commented off for frontend-only mode) ---
  /*
  const payload = lookbackDays ? { sales_lookback_days: lookbackDays } : {};
  const res = await fetch(`${API_BASE}/api/run-allocation`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Allocation failed');
  }
  return res.json();
  */
}

export async function getAllocationResults(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.store_name) searchParams.set('store_name', params.store_name);
  if (params.brand_name) searchParams.set('brand_name', params.brand_name);
  if (params.match_type) searchParams.set('match_type', params.match_type);
  if (params.region) searchParams.set('region', params.region);
  if (params.zone) searchParams.set('zone', params.zone);
  if (params.group_by) searchParams.set('group_by', params.group_by);
  if (params.dispatch_only) searchParams.set('dispatch_only', 'true');
  if (params.store_category) searchParams.set('store_category', params.store_category);
  if (params.page) searchParams.set('page', params.page);
  if (params.page_size) searchParams.set('page_size', params.page_size);

  const res = await fetch(`${API_BASE}/api/allocation/results?${searchParams}`);
  return res.json();
}

export async function getAllocationSummary() {
  // --- FRONTEND STATIC CACHE MODE ---
  try {
    const res = await fetch('/data/allocation_results.json').then(r => r.ok ? r.json() : null);
    if (res && res.summary) return res.summary;
    return null;
  } catch (e) {
    return null;
  }
  /*
  const res = await fetch(`${API_BASE}/api/allocation/summary`);
  return res.json();
  */
}

export async function getUniquenessLookup() {
  // --- FRONTEND STATIC CACHE MODE ---
  try {
    const raw = await fetch('/data/planogram_edited.json').then(r => r.ok ? r.json() : []);
    const lookup = {};
    raw.forEach(r => {
      const key = `${r.store_name}__${r.brand_name}`;
      lookup[key] = {
        uniqueness_before: r['uniqueness_(%)'] || 0,
        uniqueness_after: r['uniqueness_(%)'] || 0
      };
    });
    return lookup;
  } catch (e) {
    return {};
  }
  /*
  const res = await fetch(`${API_BASE}/api/allocation/uniqueness`);
  return res.json();
  */
}

export async function getDispatchOrder(storeName) {
  const res = await fetch(`${API_BASE}/api/allocation/dispatch/${encodeURIComponent(storeName)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Not found');
  }
  return res.json();
}

export async function getDispatchOrderByBrand(brandName) {
  const res = await fetch(`${API_BASE}/api/allocation/dispatch/brand/${encodeURIComponent(brandName)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Not found');
  }
  return res.json();
}

export async function getDispatchOrderByRegion(regionName) {
  const res = await fetch(`${API_BASE}/api/allocation/dispatch/region/${encodeURIComponent(regionName)}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Not found');
  }
  return res.json();
}

export async function getStores() {
  const res = await fetch(`${API_BASE}/api/stores`);
  return res.json();
}

export async function getStoreDetail(storeName) {
  const res = await fetch(`${API_BASE}/api/allocation/store-detail/${encodeURIComponent(storeName)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch store detail');
  }
  return res.json();
}

export async function getBrands() {
  const res = await fetch(`${API_BASE}/api/brands`);
  return res.json();
}

export async function getBrandDetail(brandName) {
  const res = await fetch(`${API_BASE}/api/allocation/brand-detail/${encodeURIComponent(brandName)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch brand detail');
  }
  return res.json();
}

export async function getRegions() {
  const res = await fetch(`${API_BASE}/api/regions`);
  return res.json();
}

export async function getRegionDetail(regionName) {
  const res = await fetch(`${API_BASE}/api/allocation/region-detail/${encodeURIComponent(regionName)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to fetch region detail');
  }
  return res.json();
}

export async function getSalesAnalytics() {
  const res = await fetch(`${API_BASE}/api/analytics/sales`);
  return res.json();
}

export async function getExecutiveAnalytics() {
  const res = await fetch(`${API_BASE}/api/analytics/executive`);
  return res.json();
}

export async function getAssortmentAnalytics() {
  const res = await fetch(`${API_BASE}/api/analytics/assortment`);
  return res.json();
}

export async function getStrategy() {
  // --- FRONTEND STATIC CACHE MODE ---
  try {
    const res = await fetch('/data/strategy_settings.json').then(r => r.ok ? r.json() : null);
    if (res && res.store_lists) {
      const all_cats = ["A", "B", "C"];
      const columns = {};
      
      all_cats.forEach(cat => {
        const storeNames = res.store_lists[cat] || [];
        columns[cat] = storeNames.map(sname => ({
          store_name: sname,
          category: cat,
          sales_7d: Math.floor(Math.random() * 20) + 5,
          sales_30d: Math.floor(Math.random() * 80) + 25,
          sales_60d: Math.floor(Math.random() * 150) + 50,
          soh: Math.floor(Math.random() * 200) + 100,
          str_pct: Math.floor(Math.random() * 25) + 5
        }));
      });

      return {
        status: "success",
        categories: all_cats,
        active_categories: res.active_categories || all_cats,
        columns: columns
      };
    }
  } catch (e) {
    console.error('Failed to load strategy settings in static mode', e);
  }
  return { status: "success", categories: ["A", "B", "C"], active_categories: ["A", "B", "C"], columns: { A: [], B: [], C: [] } };
  /*
  const res = await fetch(`${API_BASE}/api/settings/strategy`);
  return res.json();
  */
}

export async function updateStrategy(payload) {
  // Mock update in frontend mode
  console.log('Strategy updated in frontend mode:', payload);
  return { status: 'success', data: payload };
  /*
  const res = await fetch(`${API_BASE}/api/settings/strategy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to save strategy');
  }
  return res.json();
  */
}

export async function getPlanogramData(params = {}) {
  // --- FRONTEND STATIC CACHE MODE ---
  try {
    const raw = await fetch('/data/planogram_edited.json').then(r => r.ok ? r.json() : []);
    let filtered = raw;
    if (params.store_name) filtered = filtered.filter(r => r.store_name === params.store_name);
    if (params.brand_name) filtered = filtered.filter(r => r.brand_name === params.brand_name);
    if (params.region) filtered = filtered.filter(r => r.region === params.region);
    if (params.zone) filtered = filtered.filter(r => r.zone === params.zone);
    if (params.store_category) filtered = filtered.filter(r => r.store_category === params.store_category);
    if (params.commodity) filtered = filtered.filter(r => r.commodity === params.commodity);
    
    const page = parseInt(params.page || 1, 10);
    const pageSize = parseInt(params.page_size || 5000, 10);
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
      data: paginated,
      total: filtered.length,
      page,
      page_size: pageSize
    };
  } catch (e) {
    console.error('Failed to load planogram static data', e);
    return { data: [], total: 0, page: 1, page_size: 5000 };
  }

  // --- BACKEND API CALLS (Commented off for frontend-only mode) ---
  /*
  const searchParams = new URLSearchParams();
  if (params.store_name) searchParams.set('store_name', params.store_name);
  if (params.brand_name) searchParams.set('brand_name', params.brand_name);
  if (params.region) searchParams.set('region', params.region);
  if (params.zone) searchParams.set('zone', params.zone);
  if (params.store_category) searchParams.set('store_category', params.store_category);
  if (params.commodity) searchParams.set('commodity', params.commodity);
  if (params.page) searchParams.set('page', params.page);
  if (params.page_size) searchParams.set('page_size', params.page_size);

  const res = await fetch(`${API_BASE}/api/planogram?${searchParams}`);
  return res.json();
  */
}

export async function updatePlanogramData(updates) {
  // Update in local memory/cache for now
  console.log('Planogram updates received (frontend mode):', updates);
  return { status: 'success', updated: updates.length };
  /*
  const res = await fetch(`${API_BASE}/api/planogram/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to update planogram');
  }
  return res.json();
  */
}

export async function getPlanogramVersions() {
  try {
    const res = await fetch('/data/planogram_versions.json').then(r => r.ok ? r.json() : []);
    return res;
  } catch (e) {
    return [];
  }
  /*
  const res = await fetch(`${API_BASE}/api/planogram/versions`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to fetch planogram versions');
  }
  return res.json();
  */
}

export async function restorePlanogramVersion(versionId) {
  return { status: 'success', restored: versionId };
  /*
  const res = await fetch(`${API_BASE}/api/planogram/restore/${versionId}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to restore planogram version');
  }
  return res.json();
  */
}
