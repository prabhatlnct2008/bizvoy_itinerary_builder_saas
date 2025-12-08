// User and Auth types
export interface User {
  id: string;
  agency_id: string;
  email: string;
  full_name: string;
  phone?: string | null;
  is_active: boolean;
  is_superuser: boolean;
  is_bizvoy_admin?: boolean;
  force_password_reset?: boolean;
  created_at: string;
  updated_at: string;
  agency?: Agency; // Optional populated agency object
}

export interface Agency {
  id: string;
  name: string;
  subdomain: string | null;
  logo_url: string | null;
  contact_email: string;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // New fields for Agency Management
  legal_name?: string | null;
  country?: string | null;
  timezone?: string | null;
  default_currency?: string | null;
  website_url?: string | null;
  internal_notes?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Permission and Role types
export interface Permission {
  id: string;
  module: string;
  action: string;
  codename: string;
}

export interface Role {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserWithRoles extends User {
  roles: string[]; // List of role names
}

// Request types for User
export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  is_superuser?: boolean;
  is_active?: boolean;
  role_ids?: string[];
}

export interface UserUpdate {
  email?: string;
  full_name?: string;
  password?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  role_ids?: string[];
}

// Request types for Role
export interface RoleCreate {
  name: string;
  description?: string | null;
  permission_ids: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string | null;
  permission_ids?: string[];
}

// Activity types
export interface ActivityType {
  id: string;
  agency_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  agency_id: string;
  activity_type_id: string | null;
  name: string;
  category_label?: string | null;
  location_display?: string | null;
  location?: string | null;  // Legacy field, keep for compatibility
  short_description?: string | null;
  client_description?: string | null;
  description?: string | null;  // Legacy field, keep for compatibility
  default_duration_value?: number | null;
  default_duration_unit?: string | null;
  rating?: number | null;
  group_size_label?: string | null;
  cost_type?: string | null;
  cost_display?: string | null;
  highlights?: string | null;
  tags?: string | null;
  is_active: boolean;
  internal_notes?: string | null;
  base_price?: number | null;  // Legacy field, keep for compatibility
  pricing_model?: string | null;  // Legacy field, keep for compatibility
  pricing_notes?: string | null;  // Legacy field, keep for compatibility
  min_duration_minutes?: number | null;  // Legacy field, keep for compatibility
  max_duration_minutes?: number | null;  // Legacy field, keep for compatibility
  created_at: string;
  updated_at: string;
}

export interface ActivityImage {
  id: string;
  activity_id: string;
  file_path: string;
  caption?: string | null;
  display_order: number;
  is_primary?: boolean;
  is_hero?: boolean;
  uploaded_at: string;
}

export interface ActivityDetail extends Activity {
  images: ActivityImage[];
}

// Request types for Activity
export interface ActivityTypeCreate {
  name: string;
  description?: string | null;
}

export interface ActivityCreate {
  activity_type_id?: string | null;
  name: string;
  category_label?: string | null;
  location_display?: string | null;
  location?: string | null;
  short_description?: string | null;
  client_description?: string | null;
  description?: string | null;
  default_duration_value?: number | null;
  default_duration_unit?: string | null;
  rating?: number | null;
  group_size_label?: string | null;
  cost_type?: string | null;
  cost_display?: string | null;
  highlights?: string | null;
  tags?: string | null;
  is_active?: boolean;
  internal_notes?: string | null;
  base_price?: number | null;
  pricing_model?: string | null;
  pricing_notes?: string | null;
  min_duration_minutes?: number | null;
  max_duration_minutes?: number | null;
}

export interface ActivityUpdate {
  activity_type_id?: string | null;
  name?: string;
  category_label?: string | null;
  location_display?: string | null;
  location?: string | null;
  short_description?: string | null;
  client_description?: string | null;
  description?: string | null;
  default_duration_value?: number | null;
  default_duration_unit?: string | null;
  rating?: number | null;
  group_size_label?: string | null;
  cost_type?: string | null;
  cost_display?: string | null;
  highlights?: string | null;
  tags?: string | null;
  is_active?: boolean;
  internal_notes?: string | null;
  base_price?: number | null;
  pricing_model?: string | null;
  pricing_notes?: string | null;
  min_duration_minutes?: number | null;
  max_duration_minutes?: number | null;
}

export interface ActivitySearchRequest {
  query: string;
  limit?: number;
}

// Template types
export interface TemplateDayActivity {
  id: string;
  template_day_id: string;
  activity_id: string;
  display_order: number;
  time_slot: string | null;
  custom_notes: string | null;
}

export interface TemplateDay {
  id: string;
  template_id: string;
  day_number: number;
  title: string | null;
  notes: string | null;
  activities: TemplateDayActivity[];
}

export type TemplateStatus = 'draft' | 'published' | 'archived';

export interface Template {
  id: string;
  agency_id: string;
  name: string;
  destination: string;
  duration_days: number;
  duration_nights: number;
  description: string | null;
  approximate_price: number | null;
  status: TemplateStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateListItem {
  id: string;
  name: string;
  destination: string;
  duration_days: number;
  duration_nights: number;
  status: TemplateStatus;
  updated_at: string;
  usage_count: number;
}

export interface TemplateDetail extends Template {
  days: TemplateDay[];
}

// Request types for Template
export interface TemplateDayActivityCreate {
  activity_id: string;
  display_order: number;
  time_slot?: string | null;
  custom_notes?: string | null;
}

export interface TemplateDayCreate {
  day_number: number;
  title?: string | null;
  notes?: string | null;
  activities: TemplateDayActivityCreate[];
}

export interface TemplateCreate {
  name: string;
  destination: string;
  duration_days: number;
  duration_nights: number;
  description?: string | null;
  approximate_price?: number | null;
  status?: TemplateStatus;
  days: TemplateDayCreate[];
}

export interface TemplateUpdate {
  name?: string;
  destination?: string;
  duration_days?: number;
  duration_nights?: number;
  description?: string | null;
  approximate_price?: number | null;
  status?: TemplateStatus;
  days?: TemplateDayCreate[];
}

// Itinerary types
export interface ItineraryDayActivity {
  id: string;
  itinerary_day_id: string;
  activity_id: string;
  display_order: number;
  time_slot: string | null;
  custom_notes: string | null;
  custom_price: number | null;
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  actual_date: string;
  title: string | null;
  notes: string | null;
  activities: ItineraryDayActivity[];
}

export interface Itinerary {
  id: string;
  agency_id: string;
  template_id: string | null;
  trip_name: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  num_adults: number;
  num_children: number;
  status: 'draft' | 'sent' | 'confirmed' | 'completed' | 'cancelled';
  total_price: number | null;
  special_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDetail extends Itinerary {
  days: ItineraryDay[];
}

// Request types for Itinerary
export interface ItineraryDayActivityCreate {
  activity_id: string;
  display_order: number;
  time_slot?: string | null;
  custom_notes?: string | null;
  custom_price?: number | null;
}

export interface ItineraryDayCreate {
  day_number: number;
  actual_date: string;
  title?: string | null;
  notes?: string | null;
  activities: ItineraryDayActivityCreate[];
}

export interface ItineraryCreate {
  template_id?: string | null;
  trip_name: string;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  destination: string;
  start_date: string;
  end_date: string;
  num_adults: number;
  num_children: number;
  status?: 'draft' | 'sent' | 'confirmed' | 'completed' | 'cancelled';
  total_price?: number | null;
  special_notes?: string | null;
  days?: ItineraryDayCreate[];
}

export interface ItineraryUpdate {
  trip_name?: string;
  client_name?: string;
  client_email?: string | null;
  client_phone?: string | null;
  destination?: string;
  start_date?: string;
  end_date?: string;
  num_adults?: number;
  num_children?: number;
  status?: 'draft' | 'sent' | 'confirmed' | 'completed' | 'cancelled';
  total_price?: number | null;
  special_notes?: string | null;
  days?: ItineraryDayCreate[];
}

// Share types
export interface ShareLink {
  id: string;
  itinerary_id: string;
  token: string;
  is_active: boolean;
  live_updates_enabled: boolean;
  expires_at: string | null;
  view_count: number;
  last_viewed_at: string | null;
  created_at: string;
}

export interface PDFExport {
  id: string;
  itinerary_id: string;
  file_path: string;
  generated_by: string | null;
  generated_at: string;
}

// Request types for Sharing
export interface ShareLinkCreate {
  is_active?: boolean;
  live_updates_enabled?: boolean;
  expires_at?: string | null;
}

export interface ShareLinkUpdate {
  is_active?: boolean;
  live_updates_enabled?: boolean;
  expires_at?: string | null;
}

export interface PublicActivityImage {
  url: string;
  file_path: string;
  caption: string | null;
  is_primary: boolean;
  is_hero: boolean;
}

export interface PublicActivity {
  id: string;
  itinerary_day_id: string;
  activity_id: string;
  display_order: number;
  time_slot: string | null;
  custom_notes: string | null;
  custom_price: number | null;
  // Activity details
  name: string;
  activity_type_name: string | null;
  category_label: string | null;
  location_display: string | null;
  short_description: string | null;
  client_description: string | null;
  // Meta
  default_duration_value: number | null;
  default_duration_unit: string | null;
  rating: number | null;
  group_size_label: string | null;
  cost_type: string;
  cost_display: string | null;
  // Highlights
  highlights: string[] | null;
  images: PublicActivityImage[];
}

export interface PublicItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  actual_date: string;
  title: string | null;
  notes: string | null;
  activities: PublicActivity[];
}

export interface PublicCompanyProfile {
  company_name: string | null;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  payment_qr_url: string | null;
  payment_note: string | null;
}

export interface PublicPricing {
  base_package: number | null;
  taxes_fees: number | null;
  discount_code: string | null;
  discount_amount: number | null;
  total: number | null;
  currency: string;
}

export interface TripOverview {
  total_days: number;
  total_nights: number;
  accommodation_count: number;
  activity_count: number;
  meal_count: number;
  transfer_count: number;
}

export interface PublicItineraryResponse {
  id: string;
  trip_name: string;
  client_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  num_adults: number;
  num_children: number;
  status: string;
  total_price: number | null;
  special_notes: string | null;
  days: PublicItineraryDay[];
  trip_overview: TripOverview;
  company_profile: PublicCompanyProfile | null;
  pricing: PublicPricing | null;
  live_updates_enabled: boolean;
  share_link: ShareLink;
}

// API Response types
export interface MessageResponse {
  message: string;
}

export interface ApiError {
  detail: string;
  error_code?: string;
}

// ============================================
// Bizvoy Admin - Agency Management Types
// ============================================

export interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AgencyAdminUserCreate {
  full_name: string;
  email: string;
  phone?: string | null;
}

export interface AgencyCreate {
  name: string;
  legal_name?: string | null;
  country?: string | null;
  timezone?: string | null;
  default_currency?: string | null;
  website_url?: string | null;
  internal_notes?: string | null;
  contact_email?: string | null;
  admin_user: AgencyAdminUserCreate;
}

export interface AgencyUpdate {
  name?: string;
  legal_name?: string | null;
  country?: string | null;
  timezone?: string | null;
  default_currency?: string | null;
  website_url?: string | null;
  internal_notes?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  logo_url?: string | null;
}

export interface AgencyWithStats extends Agency {
  user_count: number;
  itinerary_count: number;
  template_count: number;
  primary_admin?: AdminUser | null;
}

export interface AgencyListItem {
  id: string;
  name: string;
  contact_email: string;
  is_active: boolean;
  created_at: string;
  user_count: number;
  itinerary_count: number;
  primary_admin_name?: string | null;
  primary_admin_email?: string | null;
}

export interface AgencyListResponse {
  items: AgencyListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface TopAgency {
  id: string;
  name: string;
  itinerary_count: number;
  last_activity?: string | null;
}

export interface AdminDashboardStats {
  total_agencies: number;
  active_agencies: number;
  inactive_agencies: number;
  total_itineraries: number;
  itineraries_last_30_days: number;
  total_templates: number;
  total_users: number;
  top_agencies: TopAgency[];
}

export interface AgencyStatusChange {
  id: string;
  name: string;
  is_active: boolean;
  message: string;
}

export interface ResendInvitationRequest {
  user_id: string;
}

export interface ResendInvitationResponse {
  success: boolean;
  message: string;
}

export interface ChangePasswordRequest {
  user_id: string;
  password_mode: 'auto' | 'manual';
  manual_password?: string;
  send_email: boolean;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
  new_password?: string | null;
}
