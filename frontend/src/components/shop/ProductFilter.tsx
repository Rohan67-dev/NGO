import React, { useEffect, useState } from 'react';
import { Category } from '../../types';
import { Filter, RotateCcw, Search } from 'lucide-react';

export interface ShopFilters {
  categoryId: number | null;
  query: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

interface ProductFilterProps {
  categories: Category[];
  filters: ShopFilters;
  onChange: (changes: Partial<ShopFilters>) => void;
  onReset: () => void;
}

export const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Alphabetical (A-Z)' },
];

export const ProductFilter: React.FC<ProductFilterProps> = ({ categories, filters, onChange, onReset }) => {
  // Local drafts so typing doesn't fire a request per keystroke; applied on submit.
  const [query, setQuery] = useState(filters.query);
  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);

  useEffect(() => setQuery(filters.query), [filters.query]);
  useEffect(() => setMinPrice(filters.minPrice), [filters.minPrice]);
  useEffect(() => setMaxPrice(filters.maxPrice), [filters.maxPrice]);

  const applyText = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ query: query.trim(), minPrice, maxPrice });
  };

  const invalidRange = minPrice !== '' && maxPrice !== '' && Number(minPrice) > Number(maxPrice);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" aria-hidden="true" /> Catalog Filters
        </h2>
        <button onClick={onReset} className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors">
          <RotateCcw className="w-3 h-3" aria-hidden="true" /> Reset
        </button>
      </div>

      <form onSubmit={applyText} className="space-y-4" role="search">
        <div>
          <label htmlFor="shop-search" className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">Search</label>
          <div className="relative">
            <input
              id="shop-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, material or SKU"
              maxLength={100}
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" aria-hidden="true" />
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Price (₹)</legend>
          <div className="flex items-center gap-2">
            <label htmlFor="min-price" className="sr-only">Minimum price</label>
            <input id="min-price" type="number" min={0} inputMode="numeric" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min" className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" />
            <span className="text-slate-400 text-xs">to</span>
            <label htmlFor="max-price" className="sr-only">Maximum price</label>
            <input id="max-price" type="number" min={0} inputMode="numeric" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500" />
          </div>
          {invalidRange && <p className="text-[11px] text-red-600 mt-1">Minimum is higher than maximum.</p>}
        </fieldset>

        <button type="submit" disabled={invalidRange} className="w-full btn-primary py-2">Apply</button>
      </form>

      <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
        <input type="checkbox" checked={filters.inStock} onChange={(e) => onChange({ inStock: e.target.checked })} className="accent-emerald-600" />
        In stock only
      </label>

      <div>
        <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Categories</h3>
        <div className="space-y-1">
          <button
            onClick={() => onChange({ categoryId: null })}
            aria-pressed={filters.categoryId === null}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filters.categoryId === null ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onChange({ categoryId: cat.id })}
              aria-pressed={filters.categoryId === cat.id}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex justify-between ${
                filters.categoryId === cat.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{cat.name}</span>
              {cat.productCount != null && <span className="text-slate-400">{cat.productCount}</span>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="shop-sort" className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 block">Sort By</label>
        <select
          id="shop-sort"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value })}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:border-emerald-500"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
