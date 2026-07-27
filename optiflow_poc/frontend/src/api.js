const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://optiflow-backend-977593391877.asia-south1.run.app';

export async function uploadFile(endpoint, file) {
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
}

export async function getUploadStatus() {
  const res = await fetch(`${API_BASE}/api/upload/status`);
  return res.json();
}

export async function runAllocation(lookbackDays = null) {
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
  const res = await fetch(`${API_BASE}/api/allocation/summary`);
  return res.json();
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
  const res = await fetch(`${API_BASE}/api/settings/strategy`);
  return res.json();
}

export async function updateStrategy(payload) {
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
}

export async function getPlanogramData(params = {}) {
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
}

export async function updatePlanogramData(updates) {
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
}

export async function getPlanogramVersions() {
  const res = await fetch(`${API_BASE}/api/planogram/versions`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to fetch planogram versions');
  }
  return res.json();
}

export async function restorePlanogramVersion(versionId) {
  const res = await fetch(`${API_BASE}/api/planogram/restore/${versionId}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to restore planogram version');
  }
  return res.json();
}
