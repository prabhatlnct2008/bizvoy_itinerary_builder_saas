// Activity Type interfaces
export interface ActivityType {
  id: string;
  agency_id: string;
  name: string;
  description?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityTypeCreate {
  name: string;
  description?: string;
  icon?: string;
}

export interface ActivityTypeUpdate {
  name?: string;
  description?: string;
  icon?: string;
}

// Activity interfaces
export interface ActivityImage {
  id: string;
  activity_id: string;
  file_path: string;
  file_url?: string;
  display_order: number;
  is_hero: boolean;
  uploaded_at: string;
}

export interface ActivityListItem {
  id: string;
  name: string;
  activity_type_name?: string;
  category_label?: string;
  location_display?: string;
  short_description?: string;
  hero_image_url?: string;
  is_active: boolean;
  updated_at: string;
}

export interface ActivityDetail {
  id: string;
  agency_id: string;
  activity_type_id: string;
  activity_type_name?: string;
  created_by_id?: string;
  name: string;
  category_label?: string;
  location_display?: string;
  short_description?: string;
  client_description?: string;
  default_duration_value?: number;
  default_duration_unit?: string;
  rating?: number;
  group_size_label?: string;
  cost_type: string;
  cost_display?: string;
  highlights?: string[];
  tags?: string[];
  // Gamification fields
  vibe_tags?: string[];
  is_active: boolean;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  images: ActivityImage[];
}

export interface ActivityCreate {
  activity_type_id: string;
  name: string;
  category_label?: string;
  location_display?: string;
  short_description?: string;
  client_description?: string;
  default_duration_value?: number;
  default_duration_unit?: string;
  rating?: number;
  group_size_label?: string;
  cost_type?: string;
  cost_display?: string;
  highlights?: string[];
  tags?: string[];
  is_active?: boolean;
  internal_notes?: string;
}

export interface ActivityUpdate {
  activity_type_id?: string;
  name?: string;
  category_label?: string;
  location_display?: string;
  short_description?: string;
  client_description?: string;
  default_duration_value?: number;
  default_duration_unit?: string;
  rating?: number;
  group_size_label?: string;
  cost_type?: string;
  cost_display?: string;
  highlights?: string[];
  tags?: string[];
  is_active?: boolean;
  internal_notes?: string;
}

export interface ImageUpdateRequest {
  display_order?: number;
  is_hero?: boolean;
}

export interface ActivityFilters {
  activity_type_id?: string;
  is_active?: boolean;
  search?: string;
  skip?: number;
  limit?: number;
}

// Constants
export const DURATION_UNITS = ['minutes', 'hours', 'days'] as const;
export type DurationUnit = typeof DURATION_UNITS[number];

export const COST_TYPES = ['included', 'extra'] as const;
export type CostType = typeof COST_TYPES[number];
