import client from './client';

export interface DashboardStats {
  total_itineraries: number;
  draft_itineraries: number;
  sent_itineraries: number;
  confirmed_itineraries: number;
  total_templates: number;
  total_activities: number;
  total_share_links: number;
  total_views: number;
}

export interface ItineraryStatusCount {
  status: string;
  count: number;
}

export interface RecentItinerary {
  id: string;
  trip_name: string;
  client_name: string;
  destination: string;
  start_date: string;
  status: string;
  total_price: number | null;
}

export interface RecentActivity {
  id: string;
  name: string;
  category_label: string | null;
  location_display: string | null;
  is_active: boolean;
}

export interface DashboardOverview {
  stats: DashboardStats;
  status_breakdown: ItineraryStatusCount[];
  recent_itineraries: RecentItinerary[];
  recent_activities: RecentActivity[];
}

const dashboardApi = {
  getStats: async (): Promise<DashboardOverview> => {
    const response = await client.get('/api/v1/dashboard/stats');
    return response.data;
  },
};

export default dashboardApi;
