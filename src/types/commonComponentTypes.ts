export interface CommonItem {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  value?: string | null;
  children?: CommonItem[];
}

export interface CommonItemCreate {
  name: string;
  value?: string;
  parent_id?: string;
}

export interface CommonItemUpdate {
  name?: string;
  parent_id?: string;
}

export interface FlattenedCommonItem extends CommonItem {
  level: number;
}
