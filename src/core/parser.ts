import { EnvLine, ParseResult } from './types.js';

export class EnvParser {
  static parse(content: string): ParseResult {
    const lines = content.split(/\r?\n/);
    const result: ParseResult = {
      lines: [],
      env: {}
    };

    lines.forEach((raw, index) => {
      const lineNum = index + 1;
      const trimmed = raw.trim();

      // Empty line
      if (!trimmed) {
        result.lines.push({ line: lineNum, raw, type: 'empty' });
        return;
      }

      // Comment
      if (trimmed.startsWith('#')) {
        result.lines.push({ line: lineNum, raw, type: 'comment' });
        return;
      }

      // Key-Value pair
      // Regex to handle KEY=VALUE, KEY="Val ue", KEY='Val ue'
      // This is a simplified regex, we might need more robust parsing later
      const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
      
      if (match) {
        const key = match[1];
        let value = match[2];
        
        // Handle quotes
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
        }
        
        // TODO: Handle inline comments after value if not quoted?
        
        result.lines.push({ 
          line: lineNum, 
          raw, 
          type: 'kv', 
          key, 
          value 
        });
        
        // Store in env object (last wins)
        result.env[key] = value;
      } else {
        // Invalid line
        result.lines.push({ 
          line: lineNum, 
          raw, 
          type: 'invalid', 
          error: 'Invalid format. Expected KEY=VALUE' 
        });
      }
    });

    return result;
  }
}
