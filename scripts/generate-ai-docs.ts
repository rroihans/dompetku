import fs from 'fs';
import path from 'path';

/**
 * GENERATE AI DOCS (BALANCED EDITION)
 * Constraints: Max 7 Files, Max 1000 Lines per file.
 * Strategy: Smart Parsing based on file importance.
 * - Schema/Types: High Detail
 * - Logic/Services: Medium Detail (Signatures)
 * - UI/Components: Low Detail (Props/Names only)
 */

const OUTPUT_DIR = 'AI_CONTEXT';
const MAX_FILES = 7;
const MAX_LINES_PER_FILE = 2000;

// Configuration
const IGNORE_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build', 'coverage', 'AI_CONTEXT', '.gemini', '.vscode', 'public', 'test'];
const IGNORE_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.DS_Store', 'favicon.ico', 'next-env.d.ts'];

// File Buckets
const BUCKETS = [
  { id: '01', name: 'Project-Config', pattern: /^(README|package\.json|tsconfig|next\.config|LOG_PERUBAHAN)/ },
  { id: '02', name: 'Database-Schema', pattern: /^(prisma\/|src\/types\/|src\/lib\/db\/)/ },
  { id: '03', name: 'Core-Services', pattern: /^src\/services\// },
  { id: '04', name: 'Server-Actions', pattern: /^src\/app\/actions\// },
  { id: '05', name: 'App-Router', pattern: /^src\/app\// },
  { id: '06', name: 'UI-Components', pattern: /^src\/components\// },
  { id: '07', name: 'Utils-Hooks', pattern: /^(src\/lib\/|src\/hooks\/)/ }
];

// Content Processor
function processFileContent(content: string, filePath: string): string {
  const ext = path.extname(filePath);
  
  // 1. High Priority: Prisma Schema & global types (Full content, stripped comments)
  if (filePath.endsWith('.prisma') || filePath.includes('types.ts')) {
    return content.split('\n')
      .filter(l => !l.trim().startsWith('//'))
      .join('\n');
  }

  // 2. Medium Priority: TS Logic (Services, Actions, Utils) -> Extract Signatures
  if (ext === '.ts') {
    return extractSignatures(content);
  }

  // 3. Low Priority: UI Components -> Extract Props & Name
  if (ext === '.tsx') {
    return extractComponentInfo(content);
  }

  // 4. Default: Truncate
  const lines = content.split('\n');
  if (lines.length > 50) {
    return [...lines.slice(0, 50), `// ... (${lines.length - 50} lines hidden)`].join('\n');
  }
  return content;
}

function extractSignatures(content: string): string {
  return content.split('\n')
    .filter(line => {
      const l = line.trim();
      return l.startsWith('export') || l.startsWith('interface') || l.startsWith('type') || l.includes('function') || l.startsWith('class');
    })
    .map(l => {
        if (l.includes('{') && !l.includes('}')) return l.split('{')[0] + '{ ... }';
        return l;
    })
    .join('\n');
}

function extractComponentInfo(content: string): string {
  const lines = content.split('\n');
  const info: string[] = [];
  lines.forEach(l => {
     if (l.includes('interface') && l.includes('Props')) info.push(l);
     if (l.startsWith('export function') || l.startsWith('export const')) {
         info.push(l.split('=')[0].split('{')[0] + ' ...');
     }
  });
  return info.length ? info.join('\n') : '// No exported components found';
}

// Directory Scanner
function scanFiles(dir: string, fileList: string[] = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (IGNORE_DIRS.includes(file) || file.startsWith('.')) continue;
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanFiles(fullPath, fileList);
    } else {
      if (!IGNORE_FILES.includes(file)) fileList.push(fullPath);
    }
  }
  return fileList;
}

async function main() {
  console.log('⚖️ Generating Balanced AI Docs...');
  
  const root = process.cwd();
  const outDir = path.join(root, OUTPUT_DIR);

  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir);

  const allFiles = scanFiles(root);
  const buckets: Record<string, string[]> = {};
  
  // init buckets
  BUCKETS.forEach(b => buckets[b.id] = []);

  // Sort files into buckets
  allFiles.forEach(file => {
    const rel = path.relative(root, file).replace(/\\/g, '/');
    const bucket = BUCKETS.find(b => b.pattern.test(rel));
    if (bucket) buckets[bucket.id].push(file);
    // Uncategorized files are skipped to save space/slots
  });

  // Process and Write
  for (const bucket of BUCKETS) {
    const files = buckets[bucket.id];
    if (!files.length) continue;

    let outputContent = `# ${bucket.name}\n\n`;
    let lineCount = 2;
    files.sort(); // Consistent order

    for (const file of files) {
        if (lineCount >= MAX_LINES_PER_FILE) {
             outputContent += `\n\n// ⚠️ File limit reached (${MAX_LINES_PER_FILE} lines). remaining files skipped.`;
             break;
        }

        const relPath = path.relative(root, file);
        const raw = fs.readFileSync(file, 'utf-8');
        const processed = processFileContent(raw, file);
        
        outputContent += `## ${relPath}\n\`\`\`${path.extname(file).replace('.', '') || 'text'}\n${processed}\n\`\`\`\n\n`;
        lineCount = outputContent.split('\n').length;
    }

    const fileName = `${bucket.id}-${bucket.name}.md`;
    fs.writeFileSync(path.join(outDir, fileName), outputContent);
    console.log(`✅ Created ${fileName} - ${lineCount} lines`);
  }
  
  console.log('Done.');
}

main().catch(console.error);