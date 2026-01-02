export interface EnvLine {
  line: number;
  raw: string;
  type: 'empty' | 'comment' | 'kv' | 'invalid';
  key?: string;
  value?: string;
  error?: string; // For inline errors like missing quotes or invalid format
}

export interface ParseResult {
  lines: EnvLine[];
  env: Record<string, string>; // The actual parsed key-values
}

export interface ValidationIssue {
  file: string;
  line: number;
  type: 'error' | 'warning';
  message: string;
  key?: string;
}
