import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../components/layouts/MainLayout';
import { AdminLayout } from '../components/layouts/AdminLayout';
import { Home } from '../components/pages/public/Home';
import { About } from '../components/pages/public/About';
import { Shop } from '../components/pages/public/Shop';
import { ProductDetails } from '../components/pages/public/ProductDetails';
import { ImpactHub } from '../components/pages/public/ImpactHub';
import { Campaigns } from '../components/pages/public/Campaigns';
import { ImpactStories } from '../components/pages/public/ImpactStories';
import { StoryDetails } from '../components/pages/public/StoryDetails';
import { Contact } from '../components/pages/public/Contact';
import { Policies } from '../components/pages/public/Policies';

import { Login } from '../components/pages/customer/Login';
import { Register } from '../components/pages/customer/Register';
import { Profile } from '../components/pages/customer/Profile';
import { Wishlist } from '../components/pages/customer/Wishlist';
import { Checkout } from '../components/pages/customer/Checkout';

import { AdminDashboard } from '../components/pages/admin/AdminDashboard';
import { AdminProducts } from '../components/pages/admin/AdminProducts';
import { AdminCategories } from '../components/pages/admin/AdminCategories';
import { AdminOrders } from '../components/pages/admin/AdminOrders';
import { AdminCampaigns } from '../components/pages/admin/AdminCampaigns';
import { AdminImpact } from '../components/pages/admin/AdminImpact';
import { AdminStories } from '../components/pages/admin/AdminStories';

import { ProtectedRoute, AdminRoute } from './ProtectedRoute';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public & Customer Layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:slug" element={<ProductDetails />} />
        <Route path="/impact" element={<ImpactHub />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/stories" element={<ImpactStories />} />
        <Route path="/stories/:slug" element={<StoryDetails />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/policies/:type" element={<Policies />} />

        {/* Guest Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authenticated Customer Routes */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      </Route>

      {/* Admin Layout & Protected Routes */}
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/campaigns" element={<AdminCampaigns />} />
        <Route path="/admin/impact" element={<AdminImpact />} />
        <Route path="/admin/stories" element={<AdminStories />} />
      </Route>
    </Routes>
  );
};
