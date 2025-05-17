export interface Tag {
  id: number;
  slug: string;
  name: string;
  color: string;
  text_color: string;
  match: string;
  matching_algorithm: number;
  is_insensitive: boolean;
  is_inbox_tag: boolean;
  document_count: number;
  owner: number | null;
  user_can_change: boolean;
}

export interface PaginationResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  all: number[];
  results: T[];
}

export interface GetTagsResponse extends PaginationResponse<Tag> {}

export interface DocumentsResponse extends PaginationResponse<Document> {}

export interface Document {
  id: number;
  correspondent: number | null;
  document_type: number | null;
  storage_path: string | null;
  title: string;
  content: string | null;
  tags: number[];
  created: string;
  created_date: string;
  modified: string;
  added: string;
  deleted_at: string | null;
  archive_serial_number: string | null;
  original_file_name: string;
  archived_file_name: string;
  owner: number | null;
  user_can_change: boolean;
  is_shared_by_requester: boolean;
  notes: any[];
  custom_fields: any[];
  page_count: number;
  mime_type: string;
  __search_hit__?: SearchHit;
}

export interface SearchHit {
  score: number;
  highlights: string;
  note_highlights: string;
  rank: number;
}
