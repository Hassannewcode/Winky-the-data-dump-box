export enum PacketSource {
  CLIPBOARD = 'CLIPBOARD',
  FILE_DROP = 'FILE_DROP',
  WINDOW_MESSAGE = 'WINDOW_MESSAGE',
  URL_PARAM = 'URL_PARAM',
  MANUAL_INPUT = 'MANUAL_INPUT',
  BROADCAST = 'BROADCAST_CHANNEL',
  GLOBAL_API = 'GLOBAL_API'
}

export enum PacketStatus {
  RAW = 'RAW',
  ANALYZING = 'ANALYZING',
  ANALYZED = 'ANALYZED',
  ERROR = 'ERROR'
}

export interface DataPacket {
  id: string;
  timestamp: number;
  source: PacketSource;
  rawContent: string | ArrayBuffer | null;
  mimeType: string;
  size: number;
  label?: string; // e.g. filename or origin
  status: PacketStatus;
  analysis?: AIAnalysisResult;
}

export interface AIAnalysisResult {
  summary: string;
  dataType: string; // e.g. "JSON Configuration", "Python Script", "Server Log"
  extractedFields?: Record<string, string | number | boolean>;
  tags: string[];
  sentiment?: string;
  securityRisk?: string;
  geoEstimate?: string;
}

export interface SignalLogEntry {
  id: string;
  timestamp: number;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'TRAFFIC';
  message: string;
  detail?: string;
}

export type FilterType = 'ALL' | PacketSource;

export interface SystemConfig {
  autoAnalyze: boolean;
  maxRetention: number;
  notifications: boolean;
  theme: 'LIGHT' | 'DARK' | 'SYSTEM';
  autoScanUrlParams: boolean;
  parameterAliases: Record<string, string>;
  urlFilters: {
    enabled: boolean;
    allowedKeys: string[];
    deniedKeys: string[];
  };
}

export interface WinkyGlobal {
  ingest: (data: any, label?: string) => void;
  getStatus: () => { listening: boolean; packets: number; version: string };
  config: SystemConfig;
}