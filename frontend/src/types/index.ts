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

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number | null;
  sku: string;
  stockQuantity: number;
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  impactDescription?: string;
  impactAmount?: number;
  status: ProductStatus;
  featured: boolean;
  imageUrls: string[];
  // Catalogue details (optional, from the NGO's product catalogue)
  sourceSerialNo?: string | null;
  brand?: string | null;
  manufacturer?: string | null;
  hsnCode?: string | null;
  gstRate?: number | null;
  material?: string | null;
  dimensions?: string | null;
  colour?: string | null;
  listingStatus?: string | null;
  extraAttributes?: Record<string, string> | null;
  createdAt: string;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  imageUrl?: string;
  price: number;
  discountPrice?: number | null;
  /** Price actually charged per unit */
  unitPrice: number;
  impactDescription?: string;
  quantity: number;
  stockQuantity: number;
  available: boolean;
  itemTotal: number;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  shippingAmount: number;
  taxAmount: number;
  taxRatePercent: number;
  totalAmount: number;
  freeShippingThreshold: number;
  hasUnavailableItems: boolean;
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
  productSlug?: string;
  productName: string;
  productSku: string;
  impactDescriptionSnapshot?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'PACKED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingAddressSnapshot: string;
  trackingNumber?: string;
  shippingCarrier?: string;
  items: OrderItem[];
  razorpayOrderId?: string;
  allowedNextStatuses: OrderStatus[];
  createdAt: string;
  updatedAt?: string;
}

export interface PaymentInit {
  razorpayKeyId: string;
  razorpayOrderId: string;
  orderId: number;
  orderNumber: string;
  amount: number;
  amountInPaise: number;
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

export interface Announcement {
  id: number;
  title: string;
  content: string;
  linkUrl?: string;
  active: boolean;
  createdAt?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export interface SiteInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface AdminAnalytics {
  totalRevenue: number;
  totalOrders: number;
  paidOrders: number;
  pendingPaymentOrders: number;
  refundsDueCount: number;
  ordersByStatus: Record<string, number>;
  totalCustomers: number;
  totalProducts: number;
  lowStockProductsCount: number;
  lowStockThreshold: number;
  activeCampaignsCount: number;
  newContactMessages: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface CatalogueImportRowMessage {
  row: number;
  sku?: string;
  message: string;
}

export interface CatalogueImportResult {
  dryRun: boolean;
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  mappedColumns: string[];
  extraColumns: string[];
  createdCategories: string[];
  errors: CatalogueImportRowMessage[];
  warnings: CatalogueImportRowMessage[];
}

/** Spring Data page as serialised by the backend */
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
  timestamp: string;
}
