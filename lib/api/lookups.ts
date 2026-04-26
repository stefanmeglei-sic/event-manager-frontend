import { apiFetch } from './client';
import type { EventCategory, EventStatus, Location } from '../types';

export async function getEventCategories(): Promise<EventCategory[]> {
  return apiFetch<EventCategory[]>('/lookups/event-categories');
}

export async function getEventStatuses(): Promise<EventStatus[]> {
  return apiFetch<EventStatus[]>('/lookups/event-statuses');
}

export async function getLocations(): Promise<Location[]> {
  return apiFetch<Location[]>('/lookups/locations');
}

export async function getParticipationTypes(): Promise<EventStatus[]> {
  return apiFetch<EventStatus[]>('/lookups/participation-types');
}
