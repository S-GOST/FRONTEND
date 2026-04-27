export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string;
}

export type CollectionResponse<T> =
  | ApiResponse<T[]>
  | { data?: T[]; [key: string]: T[] | undefined }
  | T[];

export type MutationResponse<T> = ApiResponse<T | null> | T | null;