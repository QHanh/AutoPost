export interface Service {
    id: string;
    name: string;
    description?: string | null;
    conditions?: string[];
    applied_conditions?: string[];
    created_at: string;
    updated_at: string;
    trashed_at?: string;
    user_id?: string;
    product_count?: number;
  }