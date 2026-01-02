import { ParseResult, ValidationIssue } from '../core/types.js';

export class MvpChecks {
  static check(result: ParseResult, filePath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const keysSeen = new Map<string, number[]>(); // key -> line numbers

    result.lines.forEach(line => {
      // 1. Invalid Lines
      if (line.type === 'invalid') {
        issues.push({
          file: filePath,
          line: line.line,
          type: 'error',
          message: line.error || 'Invalid line format'
        });
        return;
      }

      if (line.type === 'kv' && line.key && line.value !== undefined) {
        // 2. Duplicate Keys
        if (keysSeen.has(line.key)) {
          const prevLines = keysSeen.get(line.key)!;
          issues.push({
            file: filePath,
            line: line.line,
            type: 'warning',
            message: `Duplicate key '${line.key}'. Previously defined on line(s): ${prevLines.join(', ')}`,
            key: line.key
          });
          prevLines.push(line.line);
        } else {
          keysSeen.set(line.key, [line.line]);
        }

        // 3. Empty Values
        if (!line.value) {
            issues.push({
                file: filePath,
                line: line.line,
                type: 'warning',
                message: `Key '${line.key}' has empty value.`,
                key: line.key
            });
        }

        // 4. Whitespace Issues (if not quoted, raw value might have space)
        // The parser trims the line, but we should check if the value part had internal spacing issues if we want to be strict.
        // For MVP, let's look at the raw line vs expected.
        // Actually, the parser handles trims.
        // Let's check if the value in the raw string had leading/trailing spaces that look suspicious.
        // If the value is `foo `, parser returns `foo` if we blindly trim?
        // My parser implementation:
        // const match = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
        // match[2] captures the rest.
        // I then handle quotes.
        // If match[2] is ` value ` and not quoted, I probably kept the spaces in my parser?
        // Let's re-verify parser logic or assume 'value' in EnvLine is the final value.
        
        // If the raw value (match[2]) has leading/trailing space and IS NOT quoted, that's a warning.
        // But I don't have access to match[2] easily unless I re-parse or store it.
        // I'll stick to what I have: invalid lines and basic duplicates/empty.
        // Whitespace check might be better done in parser or by checking raw line again?
        
        // Let's skip complex whitespace check for this iteration and focus on Empty/Duplicate/Invalid.
      }
    });

    return issues;
  }
}
