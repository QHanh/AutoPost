export interface Service {
    id: string;
    name: string;
    description: string;
    conditions?: string[];
    applied_conditions?: string[];
    created_at: string;
    updated_at: string;
    product_count?: number;
  }