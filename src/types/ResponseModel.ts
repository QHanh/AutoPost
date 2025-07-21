export interface ResponseModel<T> {
  data: T;
  message: string;
  metadata?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
} 