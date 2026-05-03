import { apiFetch } from './client';
import type { Event, EventCreate, PaginatedEvents } from '../types';

export type ListEventsParams = {
  limit?: number;
  cursor?: string;
  status_id?: string;
  categorie_id?: string;
  organizer_id?: string;
  location_id?: string;
  tip_participare_id?: string;
  date_from?: string;
  date_to?: string;
  requires_registration?: boolean;
  search?: string;
};

export async function listEvents(
  params?: ListEventsParams,
): Promise<PaginatedEvents> {
  const search = new URLSearchParams();
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.status_id) search.set('status_id', params.status_id);
  if (params?.categorie_id) search.set('categorie_id', params.categorie_id);
  if (params?.organizer_id) search.set('organizer_id', params.organizer_id);
  if (params?.location_id) search.set('location_id', params.location_id);
  if (params?.tip_participare_id) search.set('tip_participare_id', params.tip_participare_id);
  if (params?.date_from) search.set('date_from', params.date_from);
  if (params?.date_to) search.set('date_to', params.date_to);
  if (params?.requires_registration !== undefined) search.set('requires_registration', String(params.requires_registration));
  if (params?.search) search.set('search', params.search);

  const query = search.toString() ? `?${search.toString()}` : '';
  return apiFetch<PaginatedEvents>(`/events${query}`);
}

export async function getEvent(id: string): Promise<Event> {
  return apiFetch<Event>(`/events/${id}`);
}

export async function createEvent(payload: EventCreate): Promise<Event> {
  return apiFetch<Event>('/events', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
