import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { ParseResult, ValidationIssue } from '../core/types.js';

export class SchemaCheck {
  static check(result: ParseResult, schemaPath: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    
    let schema: any;
    try {
      const schemaContent = readFileSync(schemaPath, 'utf8');
      schema = JSON.parse(schemaContent);
    } catch (e: any) {
      return [{
        file: schemaPath,
        line: 0,
        type: 'error',
        message: `Failed to load schema: ${e.message}`
      }];
    }

    // AJV v8 default export fix attempt for ESM
    // @ts-ignore
    const AjvClass = Ajv.default || Ajv;
    const ajv = new AjvClass({ allErrors: true });
    
    // We validate the 'env' object from ParseResult against the schema
    const validate = ajv.compile(schema);
    const valid = validate(result.env);

    if (!valid && validate.errors) {
      validate.errors.forEach((err: any) => {
        // Map AJV errors to ValidationIssue
        // Start line is hard to know for the whole object, but if we can find the key in result.lines, we can point to it.
        let lineNum = 0;
        const key = err.instancePath ? err.instancePath.substring(1) : undefined; // Remove leading /
        
        // Error might be "required property 'FOO' missing" -> finding line is impossible if missing.
        // If "pattern mismatch", we can find the key.
        
        if (key) {
             const line = result.lines.find(l => l.key === key && l.type === 'kv');
             if (line) lineNum = line.line;
        }

        // Better message formatting
        let message = err.message || 'Schema validation failed';
        if (err.keyword === 'required') {
            message = `Missing required key: ${err.params.missingProperty}`;
        }
        
        issues.push({
          file: 'env', // or passed in file path? we only have env object here. context needed?
          line: lineNum,
          type: 'error',
          message: `Schema Error: ${message}`,
          key: key
        });
      });
    }

    return issues;
  }
}
