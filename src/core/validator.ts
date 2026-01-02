import { readFileSync } from 'fs';
import { EnvParser } from './parser.js';
import { ValidationIssue } from './types.js';
import { MvpChecks } from '../features/mvp.js';
import { SchemaCheck } from '../features/schema.js';
import { SecretCheck } from '../features/secrets.js';
import { LicenseService } from '../lib/license.js';

export class Validator {
  static validate(filePath: string, options: { strict?: boolean, schema?: string } = {}): ValidationIssue[] {
    let content = '';
    try {
      content = readFileSync(filePath, 'utf8');
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return [{
            file: filePath,
            line: 0,
            type: 'error',
            message: `File not found: ${filePath}`
        }];
      }
      throw e;
    }

    const result = EnvParser.parse(content);
    
    // Run MVP Checks
    let issues = MvpChecks.check(result, filePath);

    // Run Pro Checks logic
    const hasLicense = LicenseService.checkLicense();
    const needsPro = !!options.schema || true; // Secrets check is also Pro

    if (hasLicense) {
        // Licensed User: Run checks
        if (options.schema) {
            issues = issues.concat(SchemaCheck.check(result, options.schema));
        }
        issues = issues.concat(SecretCheck.check(result, filePath));
    } else {
        // Free User
        if (options.schema) {
            issues.push({
                file: filePath,
                line: 0,
                type: 'error', // Blocking error if trying to use Pro feature without license? Or Warning? Spec says "Pro Features (LOCKED)". Typically means you can't use them.
                message: 'Schema validation is a Pro feature. Run `envcheck activate <KEY>`.'
            });
        }
        
        // For secrets, maybe we show one as a teaser? Or just warn about locked features?
        // Spec says: "Pro-only issues (no license) -> 1 + warning"
        // Let's run secret check but mask/warn? 
        // Or simpler: Just tell them they are missing out.
        
        // Actually, let's run SecretCheck but format them differently? 
        // "Detected X potential secrets. Upgrade to see details."
        const secretIssues = SecretCheck.check(result, filePath);
        if (secretIssues.length > 0) {
             issues.push({
                file: filePath,
                line: 0,
                type: 'warning',
                message: `Potential secrets detected (${secretIssues.length}).\n  • Details hidden to prevent accidental exposure.\n  • Upgrade to Pro to identify and fix them safely.`
            });
        }
    }

    return issues;
  }
}
