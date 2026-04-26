import { apiFetch } from './client';
import type { Location, LocationCreate, LocationUpdate } from '../types';

export async function listLocations(): Promise<Location[]> {
  return apiFetch<Location[]>('/locations');
}

export async function createLocation(payload: LocationCreate): Promise<Location> {
  return apiFetch<Location>('/locations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLocation(id: string, payload: LocationUpdate): Promise<Location> {
  return apiFetch<Location>(`/locations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLocation(id: string): Promise<{ detail: string }> {
  return apiFetch<{ detail: string }>(`/locations/${id}`, {
    method: 'DELETE',
  });
}
