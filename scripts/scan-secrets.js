import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI escape codes for beautiful coloring
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

console.log(`${BOLD}${CYAN}🛡️  Vigilantix AI — Git Secret Scanner${RESET}\n`);

// 1. Fetch staged files
let stagedFiles = [];
try {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
  stagedFiles = output.split('\n').map(file => file.trim()).filter(Boolean);
} catch (error) {
  console.error(`${RED}Error fetching staged files from Git:${RESET}`, error.message);
  process.exit(1);
}

if (stagedFiles.length === 0) {
  console.log(`${GREEN}No files staged for commit. Skipping scan.${RESET}`);
  process.exit(0);
}

// 2. Secret signatures (Regexes)
const SECRET_RULES = [
  {
    name: 'Supabase Anon/Service Key (JWT)',
    // Matches standard JWT structure beginning with standard Supabase base64 headers
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    test: (val) => val.length > 50 && !val.includes('...') && !val.includes('placeholder'),
  },
  {
    name: 'Generic JSON Web Token (JWT)',
    regex: /eyJhbGciOi[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_]+/g,
    test: (val) => val.length > 40 && !val.includes('placeholder') && !val.includes('your-'),
  },
  {
    name: 'OpenAI API Key',
    regex: /sk-[a-zA-Z0-9]{20,}/g,
    test: (val) => !val.includes('placeholder') && !val.includes('your-key'),
  },
  {
    name: 'Google API Key',
    regex: /AIzaSy[a-zA-Z0-9_-]{33}/g,
    test: () => true,
  },
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    test: () => true,
  },
  {
    name: 'Database Password in Connection String',
    // Looks for postgresql://user:password@host/db or mongodb+srv://...
    regex: /(?:postgresql|postgres|mongodb|mongodb\+srv|mysql):\/\/[a-zA-Z0-9_-]+:([^@\s]+)@[a-zA-Z0-9.-]+/g,
    test: (val, match) => {
      // Extract password group (index 1)
      const password = match[1];
      const placeholders = ['password', 'pwd', 'postgres', 'admin', 'root', 'your_password', '<password>', 'your-password'];
      return password && !placeholders.includes(password.toLowerCase()) && !password.startsWith('$');
    },
  },
  {
    name: 'Private Key block',
    regex: /-----BEGIN (?:RSA |EC |PGP |SSH )?PRIVATE KEY-----/g,
    test: () => true,
  }
];

// Helper to determine if a value looks like a placeholder
function isPlaceholder(value) {
  if (!value) return true;
  const clean = value.toLowerCase().trim().replace(/['"`;]/g, '');
  return (
    clean.includes('placeholder') ||
    clean.includes('your-') ||
    clean.includes('your_') ||
    clean.includes('xxxx') ||
    clean.includes('enter-here') ||
    clean.includes('change-me') ||
    clean.includes('<') ||
    clean.includes('example.co') ||
    clean.length < 8
  );
}

let violations = [];

// 3. Scan staged files
for (const file of stagedFiles) {
  const filePath = path.resolve(process.cwd(), file);
  
  // Skip if file doesn't exist or is a directory (though ACM filter usually avoids this)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    continue;
  }

  const filename = path.basename(file);

  // Rule A: Prevent committing direct .env files
  // Match files like .env, .env.local, .env.development, etc. (but NOT .env.example or *.env.example)
  if (filename.startsWith('.env') && !filename.endsWith('.example') && filename !== '.env.example') {
    violations.push({
      file,
      line: 0,
      type: 'Sensitive File',
      detail: `Direct environment configuration file '${filename}' cannot be committed.`,
      content: 'Entire file blocked.'
    });
    continue;
  }

  // Read content for text scanning
  // Only scan text-like files
  const ext = path.extname(file).toLowerCase();
  const textExtensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.example', '.yml', '.yaml', '.jsonc'];
  
  if (!textExtensions.includes(ext) && !filename.startsWith('.')) {
    continue; // Skip binaries and non-text files
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    continue; // If we can't read, skip
  }

  // Rule B: Special check for .env.example to ensure it isn't filled with real keys
  if (filename === '.env.example') {
    const lines = content.split('\n');
    lines.forEach((lineText, index) => {
      // Find lines that define variables
      const envMatch = lineText.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (envMatch) {
        const varName = envMatch[1];
        const varValue = envMatch[2].trim();
        
        // If it has a value, and that value is NOT a placeholder
        if (varValue && !isPlaceholder(varValue)) {
          violations.push({
            file,
            line: index + 1,
            type: 'Filled .env.example',
            detail: `Variable '${varName}' in .env.example seems to contain real credentials instead of a placeholder.`,
            content: lineText.trim()
          });
        }
      }
    });
    continue; // No need for generic regex scanning on .env.example
  }

  // Rule C: Scan standard files for hardcoded secrets
  const lines = content.split('\n');
  lines.forEach((lineText, index) => {
    // Check for bypass comments: // gitleaks:allow, // secret:allow, // bypass-secrets-scan
    if (lineText.includes('gitleaks:allow') || lineText.includes('secret:allow') || lineText.includes('bypass-secrets-scan')) {
      return; // Skip checking this line
    }

    for (const rule of SECRET_RULES) {
      // Reset regex index for safety
      rule.regex.lastIndex = 0;
      
      let match;
      // We loop in case of multiple matches per line
      while ((match = rule.regex.exec(lineText)) !== null) {
        const matchedValue = match[0];
        
        // Run specific rule logic
        if (rule.test(matchedValue, match)) {
          violations.push({
            file,
            line: index + 1,
            type: rule.name,
            detail: `Found hardcoded candidate for ${rule.name}`,
            content: lineText.trim()
          });
          break; // Avoid logging same rule twice for same line
        }
      }
    }
  });
}

// 4. Output results
if (violations.length > 0) {
  console.error(`${RED}${BOLD}❌ COMMIT BLOCKED: Sensitive information detected!${RESET}\n`);
  
  violations.forEach((v, index) => {
    console.error(`${YELLOW}[${index + 1}] File:${RESET} ${v.file}${v.line ? `:${v.line}` : ''}`);
    console.error(`    ${BOLD}Type:${RESET}  ${v.type}`);
    console.error(`    ${BOLD}Issue:${RESET} ${v.detail}`);
    console.error(`    ${BOLD}Line:${RESET}  ${RED}${v.content}${RESET}\n`);
  });

  console.error(`${CYAN}${BOLD}How to fix this:${RESET}`);
  console.error(`  1. Remove the secrets/credentials from the committed file.`);
  console.error(`  2. If using env vars, define them in '${BOLD}.env${RESET}' and reference them via '${BOLD}import.meta.env.VITE_...${RESET}'.`);
  console.error(`  3. If this is a false positive and the string is safe to commit:`);
  console.error(`     - Add ${GREEN}// gitleaks:allow${RESET} or ${GREEN}// secret:allow${RESET} on the same line to bypass the check.`);
  console.error(`     - Or bypass the hook temporarily using: ${YELLOW}git commit --no-verify${RESET}\n`);
  
  process.exit(1);
} else {
  console.log(`${GREEN}✅ No secrets or sensitive files detected. Proceeding with commit.${RESET}`);
  process.exit(0);
}
