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

export interface GetTagsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  all: number[];
  results: Tag[];
}
