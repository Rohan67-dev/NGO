export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER_ADMIN' | 'STAFF';
  active: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  active: boolean;
  productCount?: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  sku: string;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  impactDescription?: string;
  impactAmount?: number;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  featured: boolean;
  imageUrls: string[];
  createdAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl?: string;
  price: number;
  discountPrice?: number;
  impactDescription?: string;
  quantity: number;
  stockQuantity: number;
  itemTotal: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
}

export interface Address {
  id?: number;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  impactDescriptionSnapshot?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  shippingAddressSnapshot: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  items: OrderItem[];
  razorpayOrderId?: string;
  createdAt: string;
}

export interface PaymentInit {
  razorpayKeyId: string;
  razorpayOrderId: string;
  orderId: number;
  orderNumber: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}

export interface Campaign {
  id: number;
  title: string;
  slug: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  featured: boolean;
}

export interface ImpactMetric {
  id: number;
  title: string;
  description?: string;
  value: number;
  unit: string;
  icon?: string;
  displayOrder: number;
  active: boolean;
}

export interface ImpactProject {
  id: number;
  title: string;
  description: string;
  location: string;
  beneficiariesCount?: number;
  imageUrl?: string;
  status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
}

export interface ImpactStory {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl?: string;
  author?: string;
  published: boolean;
  publishedAt: string;
}

export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProductsCount: number;
  activeCampaignsCount: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp: string;
}
