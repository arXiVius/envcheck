#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { Validator } from './core/validator.js';
import { LicenseService } from './lib/license.js';

// For bundled output (CJS), esbuild handles __dirname correctly when platform=node
const currentDir = __dirname;

// Try to read package.json for version
const pkgPath = join(currentDir, '../package.json');
let version = '1.0.0';
try {
  const pkgContent = readFileSync(pkgPath, 'utf8');
  const pkg = JSON.parse(pkgContent);
  version = pkg.version;
} catch (e) {
  // fallback to 1.0.0
}

const program = new Command();

program
  .name('envcheck')
  .description('Paid CLI to validate .env files & catch secrets')
  .version(version);

program
  .argument('[path]', 'Path to .env file', '.env')
  .option('--json', 'Output results in JSON format')
  .option('--strict', 'Exit with error on warnings too')
  .option('--schema <path>', 'Path to JSON schema file')
  .action((path, options) => {
    try {
        // Basic check for tool error (bad path) -> exit 2
        if (!existsSync(path) || !statSync(path).isFile()) {
            console.error(chalk.red(`Tool Error: File not found or not a regular file: ${path}`));
            process.exit(2);
        }

        const issues = Validator.validate(path, { 
            strict: options.strict, 
            schema: options.schema 
        });

        const errors = issues.filter(i => i.type === 'error');
        const warnings = issues.filter(i => i.type === 'warning');
        
        // JSON Output
        if (options.json) {
            console.log(JSON.stringify({
                errors: errors.length,
                warnings: warnings.length,
                details: issues
            }, null, 2));
            
            if (errors.length > 0 || (options.strict && warnings.length > 0)) {
                process.exit(1);
            }
            return;
        }

        // Human Readable Output
        if (issues.length === 0) {
            console.log(chalk.green('✔ No issues found.'));
            return;
        }

        console.log(chalk.bold(`Found ${issues.length} issue(s) in ${path}:`));
        console.log('');

        issues.forEach(issue => {
            const symbol = issue.type === 'error' ? chalk.red('✖') : chalk.yellow('⚠');
            const loc = chalk.dim(`(line ${issue.line})`);
            const type = issue.type === 'error' ? chalk.red('Error') : chalk.yellow('Warning');
            
            console.log(`${symbol} ${type} ${loc}: ${issue.message}`);
        });

        console.log('');

        if (errors.length > 0) {
            console.log(chalk.red(`✖ Failed with ${errors.length} error(s).`));
            process.exit(1);
        } else if (options.strict && warnings.length > 0) {
            console.log(chalk.red(`✖ Failed with ${warnings.length} warning(s) (strict mode).`));
            process.exit(1);
        } else if (warnings.length > 0) {
            console.log(chalk.yellow(`⚠ Finished with ${warnings.length} warning(s).`));
        }
    } catch (e: any) {
        console.error(chalk.red(`Tool Error: ${e.message}`));
        process.exit(2);
    }
  });

program.command('activate')
  .description('Activate Pro license')
  .argument('<license_key>', 'License key to activate')
  .action(async (key) => {
    // console.log(`Activating license: ${key}`);
    try {
        const success = await LicenseService.activate(key);
        if (success) {
            console.log(chalk.green('✔ License activated successfully! Pro features unlocked.'));
        } else {
            console.log(chalk.red('✖ Invalid license key.'));
            process.exit(1);
        }
    } catch (e: any) {
        console.log(chalk.red(`✖ Activation failed: ${e.message}`));
        process.exit(1);
    }
  });


program.command('pro')
  .description('Learn about Pro features')
  .action(() => {
    console.log(chalk.bold('💎 envcheck Pro Features'));
    console.log('');
    console.log('  • ' + chalk.cyan('Secret Detection') + ': Catch AWS keys, Stripe secrets, etc.');
    console.log('  • ' + chalk.cyan('Schema Validation') + ': Ensure .env matches your schema.');
    console.log('  • ' + chalk.cyan('JSON Output') + ': Integrate with CI/CD pipelines.');
    console.log('  • ' + chalk.cyan('Offline Mode') + ': Verify anywhere, anytime.');
    console.log('');
    console.log(chalk.yellow('  Price: $15 (One-time)'));
    console.log('  Buy here: [Gumroad Link]');
    console.log('');
    console.log('  To activate:');
    console.log('    $ envcheck activate <LICENSE_KEY>');
  });

program.parse();
