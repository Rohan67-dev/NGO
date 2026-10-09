import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { axiosClient } from '../../../api/axiosClient';
import { Category } from '../../../types';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const AdminCategories: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const { data: categories, isLoading, refetch } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const res = await axiosClient.get('/categories');
      return res.data.data;
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/admin/categories', { name, description, imageUrl });
      setName('');
      setDescription('');
      setImageUrl('');
      refetch();
    } catch (e) {
      alert('Failed to create category');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Category Management</h1>
        <p className="text-xs text-slate-400 mt-1">Manage catalog categories and taxonomy hierarchy.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleCreate} className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-4 text-xs h-fit">
          <h3 className="text-sm font-bold text-white">Add New Category</h3>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Category Name</label>
            <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Description</label>
            <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-slate-300">Banner Image URL</label>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl" />
          </div>
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 font-bold py-3 rounded-xl transition-colors">
            Create Category
          </button>
        </form>

        <div className="lg:col-span-2 bg-slate-800 border border-slate-700/80 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white">Existing Categories</h3>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3 text-xs">
              {categories?.map((cat) => (
                <div key={cat.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{cat.name}</h4>
                    <p className="text-slate-400 mt-0.5">{cat.description}</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-1 rounded">/{cat.slug}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
