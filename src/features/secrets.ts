import { ParseResult, ValidationIssue } from '../core/types.js';

export class SecretCheck {
  // Patterns for potential secrets
  // These are heuristic based.
  static PATTERNS = [
    { name: 'AWS Access Key', regex: /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/ },
    { name: 'AWS Secret Key', regex: /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/ },
    { name: 'Generic Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
    { name: 'RSA Private Key', regex: /-----BEGIN RSA PRIVATE KEY-----/ },
    { name: 'Slack Token', regex: /xox[baprs]-([0-9a-zA-Z]{10,48})/ },
    { name: 'Stripe Secret Key', regex: /(sk_live|rk_live)_[0-9a-zA-Z]{24}/ },
  ];

  static check(result: ParseResult, filePath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    result.lines.forEach(line => {
      if (line.type === 'kv' && line.value) {
        for (const pattern of SecretCheck.PATTERNS) {
            if (pattern.regex.test(line.value)) {
                issues.push({
                    file: filePath,
                    line: line.line,
                    type: 'warning', // Secrets are warnings unless strict? Or huge errors? Spec says "Output: ⚠ Possible secret detected"
                    message: `Possible secret detected: ${pattern.name}`,
                    key: line.key
                });
                // Once found, maybe stop checking other patterns for this value?
                break;
            }
        }
      }
    });

    return issues;
  }
}
