import { apiFetch } from './client';
import type { Event, EventCreate, PaginatedEvents } from '../types';

export type ListEventsParams = {
  limit?: number;
  cursor?: string;
  status_id?: string;
  categorie_id?: string;
};

export async function listEvents(
  params?: ListEventsParams,
): Promise<PaginatedEvents> {
  const search = new URLSearchParams();
  if (params?.limit !== undefined) search.set('limit', String(params.limit));
  if (params?.cursor) search.set('cursor', params.cursor);
  if (params?.status_id) search.set('status_id', params.status_id);
  if (params?.categorie_id) search.set('categorie_id', params.categorie_id);

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
