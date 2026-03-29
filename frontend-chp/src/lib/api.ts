/**
 * CHP İstanbul API istemcisi.
 * Uç noktalar ve sözleşme `mobile-chp/lib/api.ts` ile aynıdır: akış, gönderi, plan,
 * tamamlama (multipart), bildirim, rapor kırılımı, org birimleri, komisyonlar vb.
 */
import type { EventCategoryId } from '@/lib/constants/eventCategories';
import type { DistrictId } from '@/lib/constants/districts';
import { getToken } from '@/lib/token';
import type { BranchKind, FeedPost, NotificationItem, PlannedEvent } from '@/lib/types';
import type { CurrentUser, OrgMembershipInfo } from '@/lib/types';

export type { CurrentUser, OrgMembershipInfo };

const PRODUCTION_API_DEFAULT = 'https://api-chp.defneqr.com/api';

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) return normalizeBase(fromEnv);
  return normalizeBase(PRODUCTION_API_DEFAULT);
}

export const API_BASE_URL = getApiBaseUrl();

const FETCH_TIMEOUT_MS = 25000;

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

function isAuthLoginPath(path: string): boolean {
  const p = path.split('?')[0];
  return p === 'auth/login/' || p.startsWith('auth/login/');
}

export function apiUrl(path: string): string {
  const p = path.replace(/^\//, '');
  return `${API_BASE_URL}/${p}`;
}

type FetchOpts = RequestInit & {
  auth?: boolean;
  skipUnauthorizedNotify?: boolean;
  timeoutMs?: number;
};

export async function apiFetch(path: string, opts: FetchOpts = {}): Promise<Response> {
  const { auth = true, skipUnauthorizedNotify = false, timeoutMs, ...init } = opts;
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }
  if (auth) {
    const t = getToken();
    if (t) headers.set('Authorization', `Token ${t}`);
  }
  const url = apiUrl(path);
  const controller = new AbortController();
  const fetchTimeout = timeoutMs ?? FETCH_TIMEOUT_MS;
  const timeoutId = setTimeout(() => controller.abort(), fetchTimeout);
  try {
    const res = await fetch(url, { ...init, headers, signal: controller.signal });
    clearTimeout(timeoutId);
    if (
      res.status === 401 &&
      auth &&
      !isAuthLoginPath(path) &&
      !skipUnauthorizedNotify
    ) {
      unauthorizedHandler?.();
    }
    return res;
  } catch (e) {
    clearTimeout(timeoutId);
    const name = e instanceof Error ? e.name : '';
    const msg = e instanceof Error ? e.message : String(e);
    if (name === 'AbortError') {
      throw new Error(`İstek zaman aşımı · ${API_BASE_URL}`);
    }
    throw new Error(`Bağlantı hatası: ${msg} · ${API_BASE_URL}`);
  }
}

export async function apiJson<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseApiErrorMessage(text || `${res.status}`));
  }
  return res.json() as Promise<T>;
}

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PlannedCategoryBreakdownRow = {
  eventCategoryId: string;
  label: string;
  count: number;
};

export type PlannedListWithBreakdown = Paginated<PlannedEvent> & {
  tamamlanan?: PlannedCategoryBreakdownRow[];
  planlanan?: PlannedCategoryBreakdownRow[];
};

export type PlannedReportQuery = {
  startGteIso: string;
  startLtIso: string;
  branch: 'all' | BranchKind;
  commissionId?: number;
};

export function formatLocalIsoForApi(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getFullYear();
  const mo = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  const offMin = -d.getTimezoneOffset();
  const sign = offMin >= 0 ? '+' : '-';
  const oh = pad(Math.floor(Math.abs(offMin) / 60));
  const om = pad(Math.abs(offMin) % 60);
  return `${y}-${mo}-${day}T${h}:${mi}:${s}${sign}${oh}:${om}`;
}

function applyPlannedReportQueryParams(
  p: URLSearchParams,
  q: PlannedReportQuery
): void {
  p.set('start_gte', q.startGteIso);
  p.set('start_lt', q.startLtIso);
  if (q.branch === 'all') {
    p.set('branch', 'all');
  } else if (q.branch === 'komisyon' && q.commissionId != null) {
    p.set('branch', 'komisyon');
    p.set('commission', String(q.commissionId));
  } else if (q.branch === 'komisyon') {
    p.set('branch', 'komisyon');
  } else {
    p.set('branch', q.branch);
  }
}

function buildPlannedReportPath(q: PlannedReportQuery): string {
  const p = new URLSearchParams();
  p.set('page_size', '1');
  p.set('status', 'planned');
  applyPlannedReportQueryParams(p, q);
  return `planned/?${p.toString()}`;
}

function normalizeBreakdownRow(raw: unknown): PlannedCategoryBreakdownRow {
  const x = raw as Record<string, unknown>;
  const count = Number(x.count ?? 0);
  return {
    eventCategoryId: String(x.eventCategoryId ?? x.event_category_id ?? ''),
    label: String(x.label ?? ''),
    count: Number.isFinite(count) ? count : 0,
  };
}

export async function fetchPlannedReportBreakdown(
  q: PlannedReportQuery
): Promise<{ tamamlanan: PlannedCategoryBreakdownRow[]; planlanan: PlannedCategoryBreakdownRow[] }> {
  const path = buildPlannedReportPath(q);
  const data = await apiJson<PlannedListWithBreakdown>(path, { auth: true });
  const tam = Array.isArray(data.tamamlanan)
    ? data.tamamlanan.map(normalizeBreakdownRow)
    : [];
  const plan = Array.isArray(data.planlanan)
    ? data.planlanan.map(normalizeBreakdownRow)
    : [];
  return { tamamlanan: tam, planlanan: plan };
}

export type FeedBranchQueryMode = 'default' | 'all' | 'explicit';

export type FeedQueryParams = {
  branchMode: FeedBranchQueryMode;
  branch?: BranchKind;
  commissionId?: number | null;
  districts: DistrictId[];
  categories: EventCategoryId[];
};

export async function fetchFeed(params?: FeedQueryParams): Promise<FeedPost[]> {
  const p = new URLSearchParams();
  p.set('page_size', '100');
  if (params) {
    if (params.branchMode === 'all') {
      p.set('branch', 'all');
    } else if (params.branchMode === 'explicit' && params.branch) {
      p.set('branch', params.branch);
      if (
        params.branch === 'komisyon' &&
        params.commissionId != null &&
        params.commissionId !== undefined
      ) {
        p.set('commission', String(params.commissionId));
      }
    }
    for (const d of params.districts) {
      p.append('district', d);
    }
    for (const c of params.categories) {
      p.append('category', c);
    }
  }
  const data = await apiJson<Paginated<FeedPost>>(`feed/?${p.toString()}`, {
    auth: true,
  });
  return data.results;
}

export type CommissionOption = { id: number; name: string; slug: string };

export async function fetchCommissions(): Promise<CommissionOption[]> {
  return apiJson<CommissionOption[]>('meta/commissions/', { auth: false });
}

export async function fetchPost(id: string): Promise<FeedPost> {
  return apiJson<FeedPost>(`posts/${id}/`, { auth: true });
}

export type PostUpdatePayload = {
  caption?: string;
  eventTitle?: string;
  eventDescription?: string;
  eventLocation?: string;
  eventStartAt?: string | null;
  orgUnitId?: number;
  eventCategoryId?: string;
  images?: File[];
  existingImageIds?: number[];
  clearImages?: boolean;
};

function postUpdateJsonBody(payload: PostUpdatePayload): string {
  const o: Record<string, unknown> = {};
  if (payload.caption !== undefined) o.caption = payload.caption;
  if (payload.eventTitle !== undefined) o.eventTitle = payload.eventTitle;
  if (payload.eventDescription !== undefined)
    o.eventDescription = payload.eventDescription;
  if (payload.eventLocation !== undefined) o.eventLocation = payload.eventLocation;
  if (payload.eventStartAt !== undefined) o.eventStartAt = payload.eventStartAt;
  return JSON.stringify(o);
}

export async function updatePost(
  id: string,
  payload: PostUpdatePayload
): Promise<FeedPost> {
  const hasFiles = Array.isArray(payload.images) && payload.images.length > 0;
  const wantsClear = !!payload.clearImages;
  const hasExistingIds = payload.existingImageIds !== undefined;
  const canJson =
    !hasFiles &&
    !wantsClear &&
    !hasExistingIds &&
    payload.orgUnitId === undefined &&
    payload.eventCategoryId === undefined;

  if (canJson) {
    return apiJson<FeedPost>(`posts/${id}/`, {
      method: 'PATCH',
      body: postUpdateJsonBody(payload),
      auth: true,
    });
  }

  const form = new FormData();
  if (payload.caption !== undefined) form.append('caption', payload.caption);
  if (payload.eventTitle !== undefined) form.append('eventTitle', payload.eventTitle);
  if (payload.eventDescription !== undefined)
    form.append('eventDescription', payload.eventDescription);
  if (payload.eventLocation !== undefined) form.append('eventLocation', payload.eventLocation);
  if (payload.eventStartAt !== undefined && payload.eventStartAt !== null) {
    form.append('eventStartAt', payload.eventStartAt);
  }
  if (payload.orgUnitId !== undefined) form.append('orgUnitId', String(payload.orgUnitId));
  if (payload.eventCategoryId !== undefined)
    form.append('eventCategoryId', payload.eventCategoryId);
  if (payload.clearImages) form.append('clear_images', 'true');
  if (hasExistingIds) {
    form.append('existing_image_ids', payload.existingImageIds!.join(','));
  }
  for (const file of payload.images ?? []) {
    form.append('images', file, file.name || 'photo.jpg');
  }

  return apiJson<FeedPost>(`posts/${id}/`, {
    method: 'PATCH',
    body: form,
    auth: true,
  });
}

export async function deletePost(id: string): Promise<void> {
  const res = await apiFetch(`posts/${id}/`, { method: 'DELETE', auth: true });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status}`);
  }
}

function pathFromPlannedListNext(nextUrl: string): string | null {
  try {
    const u = new URL(nextUrl, `${API_BASE_URL}/`);
    const i = u.pathname.indexOf('/api/');
    const rest = (
      i >= 0 ? u.pathname.slice(i + 5) : u.pathname
    )
      .replace(/^\/+/, '')
      .replace(/\/+$/, '');
    if (!rest) return null;
    const q = u.search && u.search.startsWith('?') ? u.search.slice(1) : '';
    return q ? `${rest}/?${q}` : `${rest}/`;
  } catch {
    return null;
  }
}

const PLANNED_LIST_MAX_PAGES = 60;

function normalizePlannedEvent(e: PlannedEvent): PlannedEvent {
  const x = e as unknown as Record<string, unknown>;
  const rawCid = x.commissionId ?? x.commission_id;
  let commissionId: number | null;
  if (rawCid === null || rawCid === undefined || rawCid === '') {
    commissionId = null;
  } else {
    const n = Number(rawCid);
    commissionId = Number.isFinite(n) ? n : null;
  }
  const br = x.branch;
  const branch =
    typeof br === 'string' && br.length > 0 ? (br.trim() as BranchKind) : e.branch;
  return { ...e, branch, commissionId };
}

export async function fetchPlannedUpcomingFiltered(
  q: PlannedReportQuery
): Promise<PlannedEvent[]> {
  const p = new URLSearchParams();
  p.set('page_size', '100');
  p.set('status', 'planned');
  applyPlannedReportQueryParams(p, q);
  const data = await apiJson<Paginated<PlannedEvent>>(`planned/?${p.toString()}`, {
    auth: true,
  });
  return data.results.map((row) => normalizePlannedEvent(row));
}

export async function fetchPlannedCompletedFiltered(
  q: PlannedReportQuery
): Promise<PlannedEvent[]> {
  const acc: PlannedEvent[] = [];
  let path: string | null = (() => {
    const p = new URLSearchParams();
    p.set('page_size', '100');
    p.set('status', 'completed');
    applyPlannedReportQueryParams(p, q);
    return `planned/?${p.toString()}`;
  })();
  for (let n = 0; n < PLANNED_LIST_MAX_PAGES && path; n++) {
    const pagePath = path;
    const data: Paginated<PlannedEvent> = await apiJson<Paginated<PlannedEvent>>(
      pagePath,
      { auth: true }
    );
    acc.push(...data.results.map((row) => normalizePlannedEvent(row)));
    path =
      data.next && String(data.next).length > 0
        ? pathFromPlannedListNext(String(data.next))
        : null;
  }
  return acc;
}

export async function fetchPlannedDetail(id: string): Promise<PlannedEvent> {
  return apiJson<PlannedEvent>(`planned/${id}/`, { auth: true });
}

export type PlannedEventUpdatePayload = {
  title?: string;
  description?: string;
  location?: string;
  startAt?: string;
  orgUnitId?: number;
  eventCategoryId?: string;
};

export async function updatePlannedEvent(
  id: string,
  payload: PlannedEventUpdatePayload
): Promise<PlannedEvent> {
  return apiJson<PlannedEvent>(`planned/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function deletePlannedEvent(id: string): Promise<void> {
  const res = await apiFetch(`planned/${id}/`, { method: 'DELETE', auth: true });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status}`);
  }
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  if (!getToken()) return [];
  try {
    const data = await apiJson<Paginated<NotificationItem>>(
      'notifications/?page_size=100',
      { auth: true }
    );
    return data.results;
  } catch {
    return [];
  }
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const j = await apiJson<{ count: number }>('notifications/unread-count/', {
    auth: true,
  });
  return j.count;
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  return apiJson<NotificationItem>(`notifications/${id}/read/`, {
    method: 'POST',
    auth: true,
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiJson<{ ok: boolean }>('notifications/read-all/', {
    method: 'POST',
    body: JSON.stringify({}),
    auth: true,
  });
}

export async function fetchOrgContextLabel(): Promise<string> {
  const j = await apiJson<{ label: string }>('meta/org-context/', {
    auth: !!getToken(),
    skipUnauthorizedNotify: true,
  });
  return j.label;
}

export async function loginApi(username: string, password: string): Promise<string> {
  const j = await apiJson<{ token: string }>('auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    auth: false,
  });
  return j.token;
}

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return apiJson<CurrentUser>('auth/me/', { auth: true });
}

export async function likePost(
  postId: string,
  liked: boolean
): Promise<{ liked: boolean; likes: number }> {
  return apiJson<{ liked: boolean; likes: number }>(`posts/${postId}/like/`, {
    method: 'POST',
    body: JSON.stringify({ liked }),
    auth: true,
  });
}

export type OrgUnitOption = {
  id: string;
  label: string;
  branch: string;
  branchLabel: string;
  geographicLevel: string;
  ilce_code: string;
};

export type EventCategoryOption = { id: string; label: string };

export async function fetchEventCategories(): Promise<EventCategoryOption[]> {
  return apiJson<EventCategoryOption[]>('meta/event-categories/', { auth: false });
}

export function parseApiErrorMessage(raw: string): string {
  const t = raw.trim();
  if (!t) return 'İstek başarısız.';
  try {
    const j = JSON.parse(t) as Record<string, unknown>;
    const d = j.detail;
    if (typeof d === 'string') return d;
    const first = Object.values(j)[0];
    if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
    if (typeof first === 'string') return first;
  } catch {
    /* */
  }
  return t.length > 200 ? `${t.slice(0, 200)}…` : t;
}

export async function fetchOrgUnits(): Promise<OrgUnitOption[]> {
  const t = getToken();
  const path = t ? 'org-units/?scope=mine' : 'org-units/';
  return apiJson<OrgUnitOption[]>(path, { auth: !!t });
}

export async function createPlannedEvent(payload: {
  title: string;
  description: string;
  org_unit_id: number;
  start_at: string;
  location: string;
  event_category_id: string;
}): Promise<PlannedEvent> {
  return apiJson<PlannedEvent>('planned/', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function completePlannedEvent(
  id: string,
  files: File[],
  caption: string
): Promise<FeedPost> {
  const token = getToken();
  if (!token) throw new Error('Oturum yok');
  const form = new FormData();
  form.append('caption', caption);
  files.forEach((f, i) => {
    form.append('images', f, f.name || `photo_${i}.jpg`);
  });
  const res = await fetch(apiUrl(`planned/${id}/complete/`), {
    method: 'POST',
    headers: { Authorization: `Token ${token}` },
    body: form,
  });
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<FeedPost>;
}
