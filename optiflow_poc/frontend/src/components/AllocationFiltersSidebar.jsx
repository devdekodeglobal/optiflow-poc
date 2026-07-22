import React, { useContext, useMemo } from 'react';
import { DataContext } from '../DataContext';
import MultiSelect from './MultiSelect';

export default function AllocationFiltersSidebar({ isDispatch }) {
  const context = useContext(DataContext);
  const masterData = context.allocationData;
  
  const filters = isDispatch ? context.dispatchFilters : context.filters;
  const setFilters = isDispatch ? context.setDispatchFilters : context.setFilters;
  const resetFilters = isDispatch ? context.resetDispatchFilters : context.resetFilters;

  const dynamicMetadata = useMemo(() => {
    const getOptions = (field) => {
      const subset = masterData.filter(item => {
        if (field !== 'zone' && filters.zone.length > 0 && !filters.zone.includes(item.zone)) return false;
        if (field !== 'region' && filters.region.length > 0 && !filters.region.includes(item.region)) return false;
        if (field !== 'store_category' && filters.store_category.length > 0 && !filters.store_category.includes(item.store_category)) return false;
        if (field !== 'store_name' && filters.store_name.length > 0 && !filters.store_name.includes(item.store_name)) return false;
        if (field !== 'brand_name' && filters.brand_name.length > 0 && !filters.brand_name.includes(item.brand_name)) return false;
        if (field !== 'commodity' && filters.commodity?.length > 0 && !filters.commodity.includes(item.commodity)) return false;
        return true;
      });
      return [...new Set(subset.map(a => a[field]).filter(Boolean))].sort();
    };

    return {
      zones: getOptions('zone'),
      regions: getOptions('region'),
      categories: getOptions('store_category'),
      stores: getOptions('store_name'),
      brands: getOptions('brand_name'),
      commodities: getOptions('commodity')
    };
  }, [masterData, filters]);

  const handleFilterChange = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
  };

  return (
    <div className="allocation-filters-sidebar" style={{ padding: '0 16px 16px 32px', marginTop: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button 
          className="btn btn-ghost btn-sm" 
          onClick={(e) => { e.stopPropagation(); resetFilters(); }} 
          style={{ fontSize: 11, padding: '2px 6px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}
        >
          Reset Filters
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <MultiSelect placeholder="All Zones" options={dynamicMetadata.zones} value={filters.zone} onChange={(val) => handleFilterChange('zone', val)} />
        <MultiSelect placeholder="All Regions" options={dynamicMetadata.regions} value={filters.region} onChange={(val) => handleFilterChange('region', val)} />
        <MultiSelect placeholder="All Grades" options={dynamicMetadata.categories} value={filters.store_category} onChange={(val) => handleFilterChange('store_category', val)} />
        <MultiSelect placeholder="All Stores" options={dynamicMetadata.stores} value={filters.store_name} onChange={(val) => handleFilterChange('store_name', val)} />
        <MultiSelect placeholder="All Brands" options={dynamicMetadata.brands} value={filters.brand_name} onChange={(val) => handleFilterChange('brand_name', val)} />
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {(dynamicMetadata.commodities.length > 0 ? dynamicMetadata.commodities : ['Frame', 'Sunglass']).map(c => {
            const isSelected = filters.commodity && filters.commodity.length > 0 ? filters.commodity.includes(c) : true;
            return (
              <button 
                key={c}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                  color: isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.85)',
                }}
                onMouseOver={e => e.currentTarget.style.background = isSelected ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'}
                onMouseOut={e => e.currentTarget.style.background = isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}
                onClick={() => {
                  let next = [];
                  const commoditiesList = dynamicMetadata.commodities.length > 0 ? dynamicMetadata.commodities : ['Frame', 'Sunglass'];
                  if (!filters.commodity || filters.commodity.length === 0) {
                    next = commoditiesList.filter(x => x !== c);
                  } else {
                    if (isSelected) {
                      next = filters.commodity.filter(x => x !== c);
                      if (next.length === 0) next = ['__NONE__'];
                    } else {
                      next = [...filters.commodity.filter(x => x !== '__NONE__'), c];
                      if (next.length === dynamicMetadata.commodities.length) next = [];
                    }
                  }
                  handleFilterChange('commodity', next);
                }}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
