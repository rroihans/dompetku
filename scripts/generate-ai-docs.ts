import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'AI-DOCS-CONSULTANT');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Helper to write file safely
function writeDoc(filename: string, content: string) {
  const filePath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filePath, content.trim());
  console.log(`Generated: ${filename}`);
}

// Helper to list directory structure
function getFileTree(dir: string, depth = 0, maxDepth = 3): string {
  if (depth > maxDepth) return '';
  const ignore = ['.git', 'node_modules', '.next', 'dist', 'build', 'coverage', '.gemini', 'AI-DOCS-CONSULTANT'];
  let output = '';
  
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      if (ignore.includes(file)) return;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      const prefix = '  '.repeat(depth) + (depth > 0 ? '├─ ' : '');
      
      if (stat.isDirectory()) {
        output += `${prefix}${file}/\n`;
        output += getFileTree(fullPath, depth + 1, maxDepth);
      } else {
        output += `${prefix}${file}\n`;
      }
    });
  } catch (e) {
    return '';
  }
  return output;
}

// Helper to recursively read specific files
function readCodeFiles(dir: string, extensions: string[], ignoreDirs: string[] = []): string {
  let output = '';
  
  function walk(currentDir: string) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      if (ignoreDirs.includes(file)) continue;
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (extensions.includes(path.extname(file))) {
        output += '\n\n## File: ' + path.relative(process.cwd(), fullPath) + '\n' + '```typescript\n';
        const content = fs.readFileSync(fullPath, 'utf-8');
        output += content.slice(0, 10000); // Truncate extremely large files
        if (content.length > 10000) output += '\n... (truncated)';
        output += '\n```';
      }
    }
  }
  
  if (fs.existsSync(dir)) walk(dir);
  return output;
}

// --- 1. Project Overview ---
function generateOverview() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const readme = fs.existsSync('README.md') ? fs.readFileSync('README.md', 'utf-8') : 'No README found.';
  const tree = getFileTree(process.cwd());

  let content = '# Project Overview\n\n';
  content += '## Dependencies\n```json\n';
  content += JSON.stringify(packageJson.dependencies, null, 2);
  content += '\n```\n\n';
  content += '## Folder Structure\n```text\n';
  content += tree;
  content += '\n```\n\n';
  content += '## README\n' + readme;

  writeDoc('01-Project-Overview.md', content);
}

// --- 2. Database Schema ---
function generateSchema() {
  const schemaPath = path.join('prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    writeDoc('02-Database-Schema.md', '# Prisma Schema\n\n```prisma\n' + schema + '\n```');
  }
}

// --- 3. Business Logic (Actions & Lib) ---
function generateBusinessLogic() {
  let content = '# Business Logic & Utilities\n';
  content += '\n# Server Actions (src/app/actions)\n';
  content += readCodeFiles(path.join('src', 'app', 'actions'), ['.ts']);
  content += '\n# Libraries (src/lib)\n';
  content += readCodeFiles(path.join('src', 'lib'), ['.ts']);
  
  writeDoc('03-Business-Logic.md', content);
}

// --- 4. Frontend Structure ---
function generateFrontend() {
  let content = '# Frontend Architecture (Next.js App Router)\n';
  // Scan for page.tsx and layout.tsx to show structure
  content += readCodeFiles(path.join('src', 'app'), ['.tsx'], ['actions', 'api']);
  writeDoc('04-Frontend-Structure.md', content);
}

// --- 5. Current Status & Plans ---
function generateStatus() {
  let content = '# Current Status & Plans\n';
  
  if (fs.existsSync('CHANGELOG.md')) {
    content += '\n## CHANGELOG\n' + fs.readFileSync('CHANGELOG.md', 'utf-8');
  }

  const conductorDir = 'conductor';
  if (fs.existsSync(conductorDir)) {
    content += '\n\n## PRODUCT SPECS\n';
    if (fs.existsSync(path.join(conductorDir, 'product.md'))) {
        content += fs.readFileSync(path.join(conductorDir, 'product.md'), 'utf-8');
    }
    
    // Check for active tracks/plans if any (simplified)
    const workflowPath = path.join(conductorDir, 'workflow.md');
    if (fs.existsSync(workflowPath)) {
       content += '\n\n## WORKFLOW\n' + fs.readFileSync(workflowPath, 'utf-8');
    }
  }

  writeDoc('05-Current-Status.md', content);
}

async function main() {
  console.log('Generating AI Consultant Documentation...');
  generateOverview();
  generateSchema();
  generateBusinessLogic();
  generateFrontend();
  generateStatus();
  console.log('Done! Files saved to AI-DOCS-CONSULTANT/');
}

main().catch(console.error);