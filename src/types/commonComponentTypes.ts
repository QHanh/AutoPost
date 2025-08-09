export interface CommonItem {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  values?: string[];
  children?: CommonItem[];
}

export interface CommonItemCreate {
  name: string;
  values?: string[];
  parent_id?: string;
}

export interface CommonItemUpdate {
  name?: string;
  values?: string[];
  parent_id?: string;
}

export interface FlattenedCommonItem extends CommonItem {
  level: number;
}
