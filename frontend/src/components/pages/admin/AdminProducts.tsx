import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Edit3, Trash2, Sparkles, X, Check } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { Product, Category } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const AdminProducts: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    sku: '',
    stockQuantity: '',
    categoryId: '',
    impactDescription: '',
    featured: false,
    imageUrls: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'],
  });

  const { data: productsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const res = await axiosClient.get('/products?size=50');
      return res.data.data;
    },
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await axiosClient.get('/categories');
      return res.data.data;
    },
  });

  const products: Product[] = productsData?.content || [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      shortDescription: '',
      price: '',
      discountPrice: '',
      sku: 'NGO-PRD-' + Math.floor(100 + Math.random() * 900),
      stockQuantity: '25',
      categoryId: categories?.[0]?.id.toString() || '1',
      impactDescription: 'Provides 2 days of fair wage to rural woman weaver.',
      featured: false,
      imageUrls: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'],
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingId(p.id);
    setFormData({
      name: p.name,
      description: p.description || '',
      shortDescription: p.shortDescription || '',
      price: p.price.toString(),
      discountPrice: p.discountPrice ? p.discountPrice.toString() : '',
      sku: p.sku,
      stockQuantity: p.stockQuantity.toString(),
      categoryId: p.categoryId.toString(),
      impactDescription: p.impactDescription || '',
      featured: p.featured,
      imageUrls: p.imageUrls?.length ? p.imageUrls : ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800'],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription,
      price: parseFloat(formData.price),
      discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
      sku: formData.sku,
      stockQuantity: parseInt(formData.stockQuantity),
      categoryId: parseInt(formData.categoryId),
      impactDescription: formData.impactDescription,
      featured: formData.featured,
      imageUrls: formData.imageUrls,
    };

    try {
      if (editingId) {
        await axiosClient.put(`/admin/products/${editingId}`, payload);
      } else {
        await axiosClient.post('/admin/products', payload);
      }
      setModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await axiosClient.delete(`/admin/products/${id}`);
        refetch();
      } catch (err) {
        alert('Failed to delete product');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Product Management</h1>
          <p className="text-xs text-slate-400 mt-1">Manage catalog inventory, pricing, and social impact tags.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="bg-slate-800 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Product</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Stock</th>
                  <th className="p-3">Impact Description</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/30">
                    <td className="p-3 flex items-center gap-3">
                      <img src={p.imageUrls?.[0] || ''} alt="" className="w-10 h-10 object-cover rounded-lg bg-slate-900" />
                      <div>
                        <span className="font-bold text-white block">{p.name}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">{p.categoryName}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">{p.sku}</td>
                    <td className="p-3 font-bold text-white">₹{p.price}</td>
                    <td className="p-3 font-semibold">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        p.stockQuantity < 10 ? 'bg-rose-900/80 text-rose-300 font-bold' : 'bg-slate-700 text-slate-200'
                      }`}>
                        {p.stockQuantity} units
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 max-w-xs truncate">{p.impactDescription || 'N/A'}</td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(p)} className="p-1.5 text-slate-300 hover:text-emerald-400">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold">{editingId ? 'Edit Product' : 'Create New Product'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-slate-300">Product Name</label>
                <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Price (₹)</label>
                  <input required type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Discount Price (₹)</label>
                  <input type="number" value={formData.discountPrice} onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">SKU</label>
                  <input required type="text" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-300">Stock Quantity</label>
                  <input required type="number" value={formData.stockQuantity} onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Category</label>
                <select value={formData.categoryId} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl">
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> NGO Impact Description
                </label>
                <textarea required rows={2} value={formData.impactDescription} onChange={(e) => setFormData({ ...formData, impactDescription: e.target.value })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-300">Image URL</label>
                <input required type="text" value={formData.imageUrls[0]} onChange={(e) => setFormData({ ...formData, imageUrls: [e.target.value] })} className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl" />
              </div>

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition-colors">
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
