import React from 'react';
import { Category } from '../../types';
import { Filter, RotateCcw } from 'lucide-react';

interface ProductFilterProps {
  categories: Category[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sortBy: string) => void;
  onReset: () => void;
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onReset,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" /> Catalog Filters
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Category List */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Categories</h4>
        <div className="space-y-1">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategoryId === null
                ? 'bg-emerald-50 text-emerald-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategoryId === cat.id
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Sort By</h4>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:border-emerald-500"
        >
          <option value="createdAt-desc">Newest Arrivals</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Alphabetical (A-Z)</option>
        </select>
      </div>
    </div>
  );
};
