export interface PricingFeature {
  id: string;
  name: string;
  value: string;
  note?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  description: string;
  popular: boolean;
  discount?: string;
  bonus?: string;
  features: PricingFeature[];
  maxUsers?: number;        // Số user tối đa cho phép
  maxPostsPerDay?: number;  // Số bài đăng tối đa/ngày
  maxStorageGB?: number;    // Dung lượng lưu trữ tối đa (GB)
  createdAt?: Date;
  updatedAt?: Date;
}

// User subscription to a plan
export interface UserSubscription {
  id: string;
  userId: string;           // Liên kết với User
  planId: string;           // Liên kết với PricingPlan
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentMethod?: string;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  totalPaid: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Subscription usage tracking
export interface SubscriptionUsage {
  id: string;
  subscriptionId: string;   // Liên kết với UserSubscription
  userId: string;           // Liên kết với User
  planId: string;           // Liên kết với PricingPlan
  date: Date;
  postsUsed: number;        // Số bài đã đăng hôm nay
  storageUsedGB: number;    // Dung lượng đã sử dụng (GB)
  featuresUsed: string[];   // Các tính năng đã sử dụng
  createdAt?: Date;
}

// Payment history
export interface PaymentHistory {
  id: string;
  subscriptionId: string;   // Liên kết với UserSubscription
  userId: string;           // Liên kết với User
  planId: string;           // Liên kết với PricingPlan
  amount: number;
  currency: string;
  paymentMethod: string;
  status: 'success' | 'failed' | 'pending' | 'refunded';
  transactionId?: string;
  paymentDate: Date;
  description?: string;
  createdAt?: Date;
}

// Frontend-only interface for UI styling
export interface PricingPlanUI extends PricingPlan {
  color: string;
  bgColor: string;
  textColor: string;
  buttonColor: string;
  gradient: string;
  icon: string;
}

// Extended user interface with subscription info
export interface UserWithSubscription {
  id: string;
  email: string;
  fullName: string;
  subscription?: UserSubscription;
  currentPlan?: PricingPlan;
  usage?: SubscriptionUsage;
  isActive: boolean;
  canPost: boolean;
  remainingPosts: number;
  remainingStorage: number;
} 