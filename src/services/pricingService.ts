import { 
    PricingPlan, 
    PricingFeature, 
    UserSubscription, 
    SubscriptionUsage, 
    PaymentHistory,
    UserWithSubscription 
  } from '../types/pricing';
  
  // Mock data
  const mockPlans: PricingPlan[] = [
    {
      id: '1',
      name: 'CƠ BẢN',
      price: 199000,
      period: '/ tháng',
      description: 'Hoàn hảo cho cá nhân',
      popular: false,
      maxUsers: 1,
      maxPostsPerDay: 3,
      maxStorageGB: 5,
      features: [
        { id: '1', name: 'Số video/ngày', value: '3' },
        { id: '2', name: 'Lên lịch trước tối đa', value: '7 ngày' },
        { id: '3', name: 'Số video có thể lưu', value: '30' },
        { id: '4', name: 'Dung lượng lưu trữ', value: '5GB' },
        { id: '5', name: 'Tài khoản MXH', value: '5' },
        { id: '6', name: 'Hỗ trợ AI', value: '✅ Full' }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      name: 'TIẾT KIỆM',
      price: 499000,
      period: '/ 3 tháng',
      description: 'Tốt nhất cho doanh nghiệp nhỏ',
      popular: true,
      discount: 'Giảm 16%',
      maxUsers: 2,
      maxPostsPerDay: 6,
      maxStorageGB: 10,
      features: [
        { id: '1', name: 'Số video/ngày', value: '6' },
        { id: '2', name: 'Lên lịch trước tối đa', value: '14 ngày' },
        { id: '3', name: 'Số video có thể lưu', value: '60' },
        { id: '4', name: 'Dung lượng lưu trữ', value: '10GB' },
        { id: '5', name: 'Tài khoản MXH', value: '8' },
        { id: '6', name: 'Hỗ trợ AI', value: '✅ Full' },
        { id: '7', name: 'Thêm thành viên', value: '+1 thành viên' }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '3',
      name: 'CHUYÊN NGHIỆP',
      price: 1699000,
      period: '/ năm',
      description: 'Cho các agency và doanh nghiệp',
      popular: false,
      bonus: 'Tặng thêm 6 tháng',
      maxUsers: 3,
      maxPostsPerDay: 9,
      maxStorageGB: 15,
      features: [
        { id: '1', name: 'Số video/ngày', value: '9' },
        { id: '2', name: 'Lên lịch trước tối đa', value: '21 ngày' },
        { id: '3', name: 'Số video có thể lưu', value: '90' },
        { id: '4', name: 'Dung lượng lưu trữ', value: '15GB' },
        { id: '5', name: 'Tài khoản MXH', value: '12' },
        { id: '6', name: 'Hỗ trợ AI', value: '✅ Full' },
        { id: '7', name: 'Thêm thành viên', value: '+2 thành viên' }
      ],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    }
  ];
  
  const mockSubscriptions: UserSubscription[] = [
    {
      id: 'sub_1',
      userId: 'user_1',
      planId: '2',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-04-01'),
      autoRenew: true,
      paymentMethod: 'credit_card',
      lastPaymentDate: new Date('2024-01-01'),
      nextPaymentDate: new Date('2024-04-01'),
      totalPaid: 499000,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'sub_2',
      userId: 'user_2',
      planId: '3',
      status: 'active',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-01-01'),
      autoRenew: true,
      paymentMethod: 'bank_transfer',
      lastPaymentDate: new Date('2024-01-01'),
      nextPaymentDate: new Date('2025-01-01'),
      totalPaid: 1699000,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    }
  ];
  
  const mockUsage: SubscriptionUsage[] = [
    {
      id: 'usage_1',
      subscriptionId: 'sub_1',
      userId: 'user_1',
      planId: '2',
      date: new Date(),
      postsUsed: 2,
      storageUsedGB: 3.5,
      featuresUsed: ['ai_content', 'scheduling'],
      createdAt: new Date()
    },
    {
      id: 'usage_2',
      subscriptionId: 'sub_2',
      userId: 'user_2',
      planId: '3',
      date: new Date(),
      postsUsed: 5,
      storageUsedGB: 8.2,
      featuresUsed: ['ai_content', 'scheduling', 'analytics'],
      createdAt: new Date()
    }
  ];
  
  const mockPayments: PaymentHistory[] = [
    {
      id: 'pay_1',
      subscriptionId: 'sub_1',
      userId: 'user_1',
      planId: '2',
      amount: 499000,
      currency: 'VND',
      paymentMethod: 'credit_card',
      status: 'success',
      transactionId: 'txn_123456',
      paymentDate: new Date('2024-01-01'),
      description: 'Thanh toán gói TIẾT KIỆM 3 tháng',
      createdAt: new Date('2024-01-01')
    },
    {
      id: 'pay_2',
      subscriptionId: 'sub_2',
      userId: 'user_2',
      planId: '3',
      amount: 1699000,
      currency: 'VND',
      paymentMethod: 'bank_transfer',
      status: 'success',
      transactionId: 'txn_789012',
      paymentDate: new Date('2024-01-01'),
      description: 'Thanh toán gói CHUYÊN NGHIỆP 1 năm',
      createdAt: new Date('2024-01-01')
    }
  ];
  
  class PricingService {
    private baseUrl = '/api/v1/pricing'; // Sẽ thay đổi khi có API thật
  
    // Pricing Plans Management
    async getPlans(): Promise<PricingPlan[]> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/plans`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => resolve([...mockPlans]), 500); // Simulate API delay
      });
    }
  
    async getPlanById(id: string): Promise<PricingPlan | null> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/plans/${id}`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const plan = mockPlans.find(p => p.id === id);
          resolve(plan || null);
        }, 300);
      });
    }
  
    async createPlan(plan: Omit<PricingPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<PricingPlan> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/plans`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(plan)
      // });
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const newPlan: PricingPlan = {
            ...plan,
            id: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockPlans.push(newPlan);
          resolve(newPlan);
        }, 500);
      });
    }
  
    async updatePlan(id: string, updates: Partial<PricingPlan>): Promise<PricingPlan> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/plans/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const index = mockPlans.findIndex(p => p.id === id);
          if (index !== -1) {
            mockPlans[index] = {
              ...mockPlans[index],
              ...updates,
              updatedAt: new Date()
            };
            resolve(mockPlans[index]);
          } else {
            throw new Error('Plan not found');
          }
        }, 500);
      });
    }
  
    async deletePlan(id: string): Promise<void> {
      // TODO: Thay thế bằng API call thật
      // await fetch(`${this.baseUrl}/plans/${id}`, { method: 'DELETE' });
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const index = mockPlans.findIndex(p => p.id === id);
          if (index !== -1) {
            mockPlans.splice(index, 1);
          }
          resolve();
        }, 300);
      });
    }
  
    // User Subscriptions Management
    async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/users/${userId}/subscriptions`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const subscriptions = mockSubscriptions.filter(s => s.userId === userId);
          resolve(subscriptions);
        }, 300);
      });
    }
  
    async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/users/${userId}/subscriptions/current`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const subscription = mockSubscriptions.find(s => 
            s.userId === userId && s.status === 'active'
          );
          resolve(subscription || null);
        }, 300);
      });
    }
  
    async createSubscription(subscription: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserSubscription> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/subscriptions`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(subscription)
      // });
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const newSubscription: UserSubscription = {
            ...subscription,
            id: `sub_${Date.now()}`,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          mockSubscriptions.push(newSubscription);
          resolve(newSubscription);
        }, 500);
      });
    }
  
    async updateSubscription(id: string, updates: Partial<UserSubscription>): Promise<UserSubscription> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/subscriptions/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(updates)
      // });
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const index = mockSubscriptions.findIndex(s => s.id === id);
          if (index !== -1) {
            mockSubscriptions[index] = {
              ...mockSubscriptions[index],
              ...updates,
              updatedAt: new Date()
            };
            resolve(mockSubscriptions[index]);
          } else {
            throw new Error('Subscription not found');
          }
        }, 500);
      });
    }
  
    // Usage Tracking
    async getUsage(userId: string, date?: Date): Promise<SubscriptionUsage | null> {
      // TODO: Thay thế bằng API call thật
      // const params = date ? `?date=${date.toISOString()}` : '';
      // const response = await fetch(`${this.baseUrl}/users/${userId}/usage${params}`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const targetDate = date || new Date();
          const usage = mockUsage.find(u => 
            u.userId === userId && 
            u.date.toDateString() === targetDate.toDateString()
          );
          resolve(usage || null);
        }, 300);
      });
    }
  
    async updateUsage(usage: Partial<SubscriptionUsage>): Promise<SubscriptionUsage> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/usage`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(usage)
      // });
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const index = mockUsage.findIndex(u => u.id === usage.id);
          if (index !== -1) {
            mockUsage[index] = { ...mockUsage[index], ...usage };
            resolve(mockUsage[index]);
          } else {
            // Create new usage record
            const newUsage: SubscriptionUsage = {
              id: `usage_${Date.now()}`,
              subscriptionId: usage.subscriptionId!,
              userId: usage.userId!,
              planId: usage.planId!,
              date: usage.date || new Date(),
              postsUsed: usage.postsUsed || 0,
              storageUsedGB: usage.storageUsedGB || 0,
              featuresUsed: usage.featuresUsed || [],
              createdAt: new Date()
            };
            mockUsage.push(newUsage);
            resolve(newUsage);
          }
        }, 300);
      });
    }
  
    // Payment History
    async getPaymentHistory(userId: string): Promise<PaymentHistory[]> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/users/${userId}/payments`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const payments = mockPayments.filter(p => p.userId === userId);
          resolve(payments);
        }, 300);
      });
    }
  
    async createPayment(payment: Omit<PaymentHistory, 'id' | 'createdAt'>): Promise<PaymentHistory> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/payments`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(payment)
      // });
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const newPayment: PaymentHistory = {
            ...payment,
            id: `pay_${Date.now()}`,
            createdAt: new Date()
          };
          mockPayments.push(newPayment);
          resolve(newPayment);
        }, 500);
      });
    }
  
    // Combined User Data
    async getUserWithSubscription(userId: string): Promise<UserWithSubscription | null> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/users/${userId}/profile`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(async () => {
          const subscription = await this.getCurrentSubscription(userId);
          const usage = await this.getUsage(userId);
          const plan = subscription ? await this.getPlanById(subscription.planId) : null;
  
          if (!subscription || !plan) {
            resolve(null);
            return;
          }
  
          const userWithSub: UserWithSubscription = {
            id: userId,
            email: 'user@example.com', // Mock data
            fullName: 'User Name', // Mock data
            subscription,
            currentPlan: plan,
            usage: usage || {
              id: 'usage_default',
              subscriptionId: subscription.id,
              userId,
              planId: plan.id,
              date: new Date(),
              postsUsed: 0,
              storageUsedGB: 0,
              featuresUsed: [],
              createdAt: new Date()
            },
            isActive: subscription.status === 'active',
            canPost: (usage?.postsUsed || 0) < (plan.maxPostsPerDay || 0),
            remainingPosts: (plan.maxPostsPerDay || 0) - (usage?.postsUsed || 0),
            remainingStorage: (plan.maxStorageGB || 0) - (usage?.storageUsedGB || 0)
          };
  
          resolve(userWithSub);
        }, 500);
      });
    }
  
    // Statistics
    async getPricingStats(): Promise<{
      totalPlans: number;
      totalSubscriptions: number;
      activeSubscriptions: number;
      totalRevenue: number;
      popularPlan: PricingPlan | null;
    }> {
      // TODO: Thay thế bằng API call thật
      // const response = await fetch(`${this.baseUrl}/stats`);
      // return response.json();
      
      return new Promise((resolve) => {
        setTimeout(() => {
          const totalPlans = mockPlans.length;
          const totalSubscriptions = mockSubscriptions.length;
          const activeSubscriptions = mockSubscriptions.filter(s => s.status === 'active').length;
          const totalRevenue = mockSubscriptions.reduce((sum, s) => sum + s.totalPaid, 0);
          const popularPlan = mockPlans.find(p => p.popular) || null;
  
          resolve({
            totalPlans,
            totalSubscriptions,
            activeSubscriptions,
            totalRevenue,
            popularPlan
          });
        }, 300);
      });
    }
  }
  
  export const pricingService = new PricingService();