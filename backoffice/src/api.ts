const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('admin_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${url}`, { ...options, headers });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

export interface User {
  id: string; email: string; full_name: string; phone: string | null;
  role: string; is_active: boolean; external_player_id: string | null; created_at: string;
}

export interface Lottery {
  id: string; name: string; description: string | null;
  start_date: string; end_date: string; draw_date: string | null;
  status: string; max_entries_per_user: number;
  ticket_price: string; currency: string;
  allow_casino_eligibility: boolean; allow_direct_purchase: boolean;
  allow_physical_sales: boolean; prize_description: string | null;
  created_at: string; updated_at: string; ticket_count: number;
}

export interface Ticket {
  id: string; lottery_id: string; user_id: string;
  ticket_code: string; qr_code_data: string | null;
  source: string; status: string; purchase_price: string; currency: string;
  created_at: string; validated_at: string | null;
  lottery_name: string | null; user_name: string | null;
}

export interface DashboardStats {
  active_lotteries: number; total_tickets_today: number;
  total_revenue_today: string; total_users: number;
  recent_tickets: Ticket[];
}

export interface LotteryStats {
  lottery_id: string; lottery_name: string;
  total_tickets: number; tickets_by_source: Record<string, number>;
  tickets_by_status: Record<string, number>;
  total_revenue: string; unique_participants: number;
}

export interface DrawResult {
  lottery_id: string; lottery_name: string;
  winners: Ticket[]; drawn_at: string;
}
