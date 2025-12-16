export interface BoardData {
  id: string;
  name?: string;
  url: string;
  thumbnail?: string;
}

export interface ExtractionState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: BoardData | null;
  error: string | null;
}

export interface ExtractionHistoryItem extends BoardData {
  timestamp: number;
}