import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Sparkles, X, Upload, Download, Search } from 'lucide-react';
import { axiosClient, getErrorMessage } from '../../../api/axiosClient';
import { Product, Category, Page, CatalogueImportResult, ProductStatus } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Pagination } from '../../common/Pagination';
import { toast } from '../../../store/useToastStore';
import { formatINR, humanize, PLACEHOLDER_IMAGE } from '../../../lib/format';

interface ProductForm {
  name: string;
  description: string;
  shortDescription: string;
  price: string;
  discountPrice: string;
  sku: string;
  stockQuantity: string;
  categoryId: string;
  impactDescription: string;
  status: ProductStatus;
  featured: boolean;
  imageUrls: string; // one per line
  sourceSerialNo: string;
  brand: string;
  manufacturer: string;
  hsnCode: string;
  gstRate: string;
  material: string;
  dimensions: string;
  colour: string;
  listingStatus: string;
}

const emptyForm = (categoryId = ''): ProductForm => ({
  name: '', description: '', shortDescription: '', price: '', discountPrice: '', sku: '', stockQuantity: '0',
  categoryId, impactDescription: '', status: 'ACTIVE', featured: false, imageUrls: '',
  sourceSerialNo: '', brand: '', manufacturer: '', hsnCode: '', gstRate: '', material: '', dimensions: '', colour: '', listingStatus: '',
});

const toForm = (p: Product): ProductForm => ({
  name: p.name,
  description: p.description || '',
  shortDescription: p.shortDescription || '',
  price: String(p.price),
  discountPrice: p.discountPrice != null ? String(p.discountPrice) : '',
  sku: p.sku,
  stockQuantity: String(p.stockQuantity),
  categoryId: String(p.categoryId),
  impactDescription: p.impactDescription || '',
  status: p.status,
  featured: p.featured,
  imageUrls: (p.imageUrls || []).join('\n'),
  sourceSerialNo: p.sourceSerialNo || '',
  brand: p.brand || '',
  manufacturer: p.manufacturer || '',
  hsnCode: p.hsnCode || '',
  gstRate: p.gstRate != null ? String(p.gstRate) : '',
  material: p.material || '',
  dimensions: p.dimensions || '',
  colour: p.colour || '',
  listingStatus: p.listingStatus || '',
});

const statusStyle: Record<ProductStatus, string> = {
  ACTIVE: 'bg-emerald-900/80 text-emerald-300',
  OUT_OF_STOCK: 'bg-amber-900/80 text-amber-300',
  INACTIVE: 'bg-slate-700 text-slate-300',
};

const ImportPanel: React.FC<{ onDone: () => void; onClose: () => void }> = ({ onDone, onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CatalogueImportResult | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (dryRun: boolean) => {
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await axiosClient.post('/admin/products/import', fd, {
        params: { dryRun },
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.data);
      if (!dryRun) {
        toast.success('Catalogue imported');
        onDone();
      }
    } catch (e) {
      toast.error(getErrorMessage(e, 'Import failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-card p-6 space-y-4 text-xs">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-white">Import catalogue (CSV)</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close import panel"><X className="w-4 h-4" /></button>
      </div>
      <p className="text-slate-400 leading-relaxed">
        Export the catalogue spreadsheet as <strong>CSV (UTF-8)</strong>. A <strong>SKU</strong> column is required. Recognised headers include
        Sr. No., Brand, Manufacturer, Product Title, HSN Code, GST, Selling Price, Description, Size, Material, Colour, Image, Upload Status, Category and Stock.
        Rows are matched on SKU: existing products are updated and <strong>blank cells never erase saved values</strong>. Unrecognised columns are kept as extra product details.
        Run a dry run first to check the result without saving.
      </p>
      <input type="file" accept=".csv,text/csv" onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }} className="text-slate-300" aria-label="CSV file" />
      <div className="flex gap-2">
        <button disabled={!file || busy} onClick={() => run(true)} className="px-4 py-2 rounded-xl border border-slate-600 font-semibold disabled:opacity-40">Dry run</button>
        <button
          disabled={!file || busy}
          onClick={() => confirm('Import this file and save changes to the catalogue?') && run(false)}
          className="btn-primary px-4 py-2"
        >
          {busy ? 'Working…' : 'Import'}
        </button>
      </div>

      {result && (
        <div className="space-y-2 border-t border-slate-700 pt-3">
          <p className="text-slate-200">
            {result.dryRun ? 'Dry run: ' : ''}{result.totalRows} rows · <span className="text-emerald-400">{result.created} new</span> ·{' '}
            <span className="text-blue-300">{result.updated} updated</span> · <span className="text-rose-300">{result.failed} failed</span>
          </p>
          {result.createdCategories.length > 0 && <p className="text-slate-400">New categories: {result.createdCategories.join(', ')}</p>}
          {result.extraColumns.length > 0 && <p className="text-slate-400">Kept as extra details: {result.extraColumns.join(', ')}</p>}
          {result.errors.length > 0 && (
            <ul className="max-h-40 overflow-y-auto space-y-0.5 text-rose-300">
              {result.errors.map((e, i) => <li key={i}>Row {e.row}{e.sku ? ` (${e.sku})` : ''}: {e.message}</li>)}
            </ul>
          )}
          {result.warnings.length > 0 && (
            <ul className="max-h-40 overflow-y-auto space-y-0.5 text-amber-300">
              {result.warnings.map((e, i) => <li key={i}>Row {e.row}{e.sku ? ` (${e.sku})` : ''}: {e.message}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export const AdminProducts: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const query = params.get('query') || '';
  const status = params.get('status') || '';
  const page = Number(params.get('page') || 0);
  const [searchDraft, setSearchDraft] = useState(query);

  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const { data: productsPage, isLoading, isError, refetch } = useQuery<Page<Product>>({
    queryKey: ['admin-products', query, status, page],
    queryFn: async () =>
      (await axiosClient.get('/admin/products', { params: { query: query || undefined, status: status || undefined, page, size: 25 } })).data.data,
    placeholderData: keepPreviousData,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => (await axiosClient.get('/admin/categories')).data.data,
  });

  const products = productsPage?.content || [];

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(emptyForm(categories?.[0]?.id.toString() || ''));
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData(toForm(p));
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const price = parseFloat(formData.price);
    const discount = formData.discountPrice ? parseFloat(formData.discountPrice) : null;
    if (discount != null && discount > price) {
      setFormError('Discount price cannot be higher than the price.');
      return;
    }
    const payload = {
      name: formData.name.trim(),
      description: formData.description,
      shortDescription: formData.shortDescription,
      price,
      discountPrice: discount,
      sku: formData.sku.trim(),
      stockQuantity: parseInt(formData.stockQuantity, 10),
      categoryId: parseInt(formData.categoryId, 10),
      impactDescription: formData.impactDescription,
      status: formData.status,
      featured: formData.featured,
      imageUrls: formData.imageUrls.split('\n').map((s) => s.trim()).filter(Boolean),
      sourceSerialNo: formData.sourceSerialNo,
      brand: formData.brand,
      manufacturer: formData.manufacturer,
      hsnCode: formData.hsnCode,
      gstRate: formData.gstRate ? parseFloat(formData.gstRate) : null,
      material: formData.material,
      dimensions: formData.dimensions,
      colour: formData.colour,
      listingStatus: formData.listingStatus,
    };

    setSaving(true);
    try {
      if (editingId) await axiosClient.put(`/admin/products/${editingId}`, payload);
      else await axiosClient.post('/admin/products', payload);
      setModalOpen(false);
      toast.success(editingId ? 'Product updated' : 'Product created');
      refetch();
    } catch (err) {
      setFormError(getErrorMessage(err, 'Error saving product'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?\n\nProducts that appear in past orders are archived (hidden from the shop) instead of deleted.`)) return;
    try {
      const res = await axiosClient.delete(`/admin/products/${p.id}`);
      toast.success(res.data.message);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete product'));
    }
  };

  const handleExport = async () => {
    try {
      const res = await axiosClient.get('/admin/products/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'catalogue-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Export failed'));
    }
  };

  const input = (key: keyof ProductForm, label: string, opts: { type?: string; required?: boolean; step?: string; min?: string } = {}) => (
    <div>
      <label htmlFor={`pf-${key}`} className="admin-label">{label}</label>
      <input
        id={`pf-${key}`}
        type={opts.type || 'text'}
        required={opts.required}
        step={opts.step}
        min={opts.min}
        value={formData[key] as string}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        className="admin-input"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Management</h1>
          <p className="text-xs text-slate-400 mt-1">Catalogue, pricing, inventory and impact details. {productsPage ? `${productsPage.totalElements} products` : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setImportOpen(!importOpen)} className="px-3 py-2 rounded-xl border border-slate-600 text-xs font-semibold flex items-center gap-1.5"><Upload className="w-4 h-4" aria-hidden="true" /> Import CSV</button>
          <button onClick={handleExport} className="px-3 py-2 rounded-xl border border-slate-600 text-xs font-semibold flex items-center gap-1.5"><Download className="w-4 h-4" aria-hidden="true" /> Export CSV</button>
          <button onClick={handleOpenCreate} className="btn-primary px-4 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" aria-hidden="true" /> Add New Product</button>
        </div>
      </div>

      {importOpen && <ImportPanel onDone={() => refetch()} onClose={() => setImportOpen(false)} />}

      <div className="flex flex-col sm:flex-row gap-3 text-xs">
        <form onSubmit={(e) => { e.preventDefault(); setParam('query', searchDraft.trim()); }} className="relative flex-1" role="search">
          <label htmlFor="admin-product-search" className="sr-only">Search products</label>
          <input id="admin-product-search" value={searchDraft} onChange={(e) => setSearchDraft(e.target.value)} placeholder="Search name, SKU or material…" className="admin-input pl-8" />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" aria-hidden="true" />
        </form>
        <label htmlFor="admin-status-filter" className="sr-only">Status</label>
        <select id="admin-status-filter" value={status} onChange={(e) => setParam('status', e.target.value)} className="admin-input sm:w-48">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
          <option value="INACTIVE">Inactive / archived</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <p className="text-xs text-rose-300" role="alert">Products could not be loaded.</p>
      ) : (
        <div className="admin-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {products.length === 0 && (
                  <tr><td colSpan={6} className="p-6 text-center text-slate-500">No products match.</td></tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrls?.[0] || PLACEHOLDER_IMAGE} alt="" className="w-10 h-10 object-cover rounded-lg bg-slate-900 shrink-0" />
                        <div>
                          <span className="font-bold text-white block">{p.name}{p.featured && <Sparkles className="inline w-3 h-3 ml-1 text-yellow-300" aria-label="Featured" />}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">{p.categoryName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{p.sku}</td>
                    <td className="p-3 font-bold text-white">
                      {p.discountPrice != null ? (<>{formatINR(p.discountPrice)} <span className="line-through text-slate-500 font-normal">{formatINR(p.price)}</span></>) : formatINR(p.price)}
                    </td>
                    <td className="p-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${p.stockQuantity < 10 ? 'bg-rose-900/80 text-rose-300 font-bold' : 'bg-slate-700 text-slate-200'}`}>
                        {p.stockQuantity} units
                      </span>
                    </td>
                    <td className="p-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusStyle[p.status]}`}>{humanize(p.status)}</span></td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-slate-300 hover:text-emerald-400" aria-label={`Edit ${p.name}`}><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p)} className="p-1.5 text-slate-400 hover:text-rose-400" aria-label={`Delete ${p.name}`}><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination dark page={page} totalPages={productsPage?.totalPages ?? 0} onPageChange={(p) => setParam('page', p ? String(p) : '')} />

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 id="product-modal-title" className="text-base font-bold">{editingId ? 'Edit Product' : 'Create New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            {formError && <div className="bg-rose-900/40 border border-rose-700 text-rose-200 text-xs rounded-xl p-3" role="alert">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              {input('name', 'Product Name', { required: true })}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {input('price', 'Price (₹)', { type: 'number', required: true, step: '0.01', min: '0' })}
                {input('discountPrice', 'Discount Price (₹)', { type: 'number', step: '0.01', min: '0' })}
                {input('stockQuantity', 'Stock Quantity', { type: 'number', required: true, step: '1', min: '0' })}
                {input('sku', 'SKU', { required: true })}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="pf-category" className="admin-label">Category</label>
                  <select id="pf-category" required value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="admin-input">
                    <option value="" disabled>Select…</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}{cat.active ? '' : ' (hidden)'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="pf-status" className="admin-label">Status</label>
                  <select id="pf-status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })} className="admin-input">
                    <option value="ACTIVE">Active (for sale)</option>
                    <option value="OUT_OF_STOCK">Out of stock</option>
                    <option value="INACTIVE">Inactive (hidden)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 mt-6 text-slate-300">
                  <input type="checkbox" checked={formData.featured} onChange={(e) => setFormData({ ...formData, featured: e.target.checked })} className="accent-emerald-500" />
                  Featured on home page
                </label>
              </div>
              {input('shortDescription', 'Short Description')}
              <div>
                <label htmlFor="pf-description" className="admin-label">Description</label>
                <textarea id="pf-description" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="pf-impact" className="admin-label text-emerald-400 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> NGO Impact Description (only verified statements)</label>
                <textarea id="pf-impact" rows={2} value={formData.impactDescription} onChange={(e) => setFormData({ ...formData, impactDescription: e.target.value })} className="admin-input" />
              </div>
              <div>
                <label htmlFor="pf-images" className="admin-label">Image URLs (one per line, first is the main image)</label>
                <textarea id="pf-images" rows={3} value={formData.imageUrls} onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })} className="admin-input font-mono" placeholder="https://… or /images/…" />
              </div>

              <fieldset className="border border-slate-700 rounded-xl p-3 space-y-3">
                <legend className="px-1 text-slate-400 font-semibold">Catalogue details (optional)</legend>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {input('material', 'Material')}
                  {input('dimensions', 'Size / Dimensions')}
                  {input('colour', 'Colour')}
                  {input('brand', 'Brand')}
                  {input('manufacturer', 'Manufacturer')}
                  {input('hsnCode', 'HSN Code')}
                  {input('gstRate', 'GST %', { type: 'number', step: '0.01', min: '0' })}
                  {input('sourceSerialNo', 'Catalogue Sr. No.')}
                  {input('listingStatus', 'Listing Status')}
                </div>
              </fieldset>

              <button type="submit" disabled={saving} className="w-full btn-primary py-3">{saving ? 'Saving…' : 'Save Product'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
