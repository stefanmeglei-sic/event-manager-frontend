export type Event = {
  id: string;
  titlu: string;
  descriere: string | null;
  start_date: string;
  end_date: string;
  locatie_id: string | null;
  categorie_id: string | null;
  status_id: string | null;
  organizer_id: string;
  tip_participare_id: string | null;
  max_participanti: number | null;
  deadline_inscriere: string | null;
  link_inscriere: string | null;
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  role: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_at: string;
};

export type EventCategory = {
  id: string;
  nume: string;
};

export type EventStatus = {
  id: string;
  nume: string;
};

export type Location = {
  id: string;
  nume_sala: string;
  corp_cladire: string | null;
  capacitate: number | null;
};

export type LocationCreate = {
  nume_sala: string;
  corp_cladire?: string | null;
  capacitate?: number | null;
};

export type LocationUpdate = {
  nume_sala?: string;
  corp_cladire?: string | null;
  capacitate?: number | null;
};

export type EventCreate = {
  titlu: string;
  descriere?: string | null;
  start_date: string;
  end_date: string;
  locatie_id?: string | null;
  categorie_id: string;
  status_id: string;
  organizer_id: string;
  tip_participare_id: string;
  max_participanti?: number | null;
  deadline_inscriere?: string | null;
  link_inscriere?: string | null;
};

export type PaginatedEvents = {
  items: Event[];
  next_cursor: string | null;
};

export type ApiError = {
  detail: string;
};
