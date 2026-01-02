# envcheck

**Fail fast when .env files are broken or unsafe.**
A fast CLI tool to validate environment variables locally and in CI.

[![License: Source Available + Commercial Pro](https://img.shields.io/badge/License-Source%20Available%20%2B%20Commercial%20Pro-blue.svg)](#)
[![Start](https://img.shields.io/badge/Get-Started-green.svg)](#installation)

---

## The Problem

Broken `.env` files cause:

- Runtime crashes
- Silent misconfigurations
- **Leaked secrets** directly in your codebase

Designed for backend developers, DevOps engineers, and teams running CI/CD.

## Why envcheck?

- **Designed for CI**: Fast, strict exit codes, and zero dependencies.
- **Local-First**: No accounts, no telemetry, no background calls.
- **Offline Pro**: Activation is Ed25519-signed and verified fully offline.
- **Small Footprint**: Keeps your repo and build pipeline clean.

`envcheck` solves this with a single command.

## 💎 Free vs Pro

| Feature               |     Free      |       Pro       |
| :-------------------- | :-----------: | :-------------: |
| **Validate .env**     |      ✅       |       ✅        |
| **Detect secrets**    | ⚠️ Count only | ✅ Full details |
| **Schema validation** |      ❌       |       ✅        |
| **CI JSON output**    |      ❌       |       ✅        |
| **Offline License**   |       -       |       ✅        |

## Usage

### Quick Start

Run it in your project root:

```bash
$ envcheck .env
```

**Learn about Pro features:**

```bash
$ envcheck pro
```

**Output when things are wrong:**

```txt
Found 3 issue(s) in .env:

⚠ Warning (line 5): Duplicate key 'DB_HOST'. Previously defined on line(s): 2
⚠ Warning (line 8): Key 'API_KEY' has empty value.
✖ Error (line 11): Invalid format. Expected KEY=VALUE

⚠ Potential secrets detected (2).
  • Details hidden to prevent accidental exposure.
  • Upgrade to Pro to identify and fix them safely.

✖ Failed with 1 error(s).
```

### Installation

**Via npm (Recommended)**

```bash
npm install -g envcheck
```

**Run via npx (No install)**

```bash
npx envcheck
```

_Verify installation:_

```bash
envcheck --version
```

---

## Features

### Pro Features

**1. Secret Detection**
Catch AWS keys, Stripe secrets, and private keys _before_ they get committed.

```bash
⚠ Warning (line 14): Possible secret detected: AWS Access Key
```

**2. Schema Validation**
Ensure your `.env` matches your `env.schema.json`.

```bash
$ envcheck .env --schema env.schema.json
✖ Error: Missing required key: DATABASE_URL
```

**3. CI/CD Integration**
Get JSON output for your pipelines.

```bash
envcheck .env --json
```

---

## Get Pro

**Price**: $15 (One-time purchase)
**Includes**: Lifetime updates, infinite local use.

1. **Buy License**: [Gumroad Link Here]
2. **Activate**:
   ```bash
   envcheck activate <YOUR-LICENSE-KEY>
   ```
3. **Enjoy**: Verification works **offline** after activation.

---

## Security & Trust

- **Zero Telemetry**: We don't send your data anywhere.
- **Offline Licensing**: License verification is fully local.

---

## Licensing

envcheck is free for core validation features.
A one-time Pro license unlocks advanced checks.

The source code is public for transparency.

> License verification uses a public-key signature embedded in the CLI.
> Pro features are unlocked locally via a license key.

---

## Development

Built with Node.js & TypeScript.

```bash
git clone ...
npm install
npm run build
npm start
```
