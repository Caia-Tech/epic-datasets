#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to fix
const files = [
  'src/pages/tools/yaml.astro',
  'src/pages/tools/xml.astro',
  'src/pages/tools/http.astro',
  'src/pages/tools/mime.astro',
  'src/pages/tools/unicode.astro',
  'src/pages/tools/webhook.astro'
];

function fixTypeScriptSyntax(content) {
  // Remove type assertions (as Type)
  content = content.replace(/ as HTMLTextAreaElement/g, '');
  content = content.replace(/ as HTMLElement/g, '');
  content = content.replace(/ as HTMLInputElement/g, '');
  content = content.replace(/ as HTMLSelectElement/g, '');
  content = content.replace(/ as HTMLButtonElement/g, '');
  content = content.replace(/ as Element/g, '');
  content = content.replace(/ as Error/g, '');
  content = content.replace(/ as any/g, '');
  content = content.replace(/ as unknown as number/g, '');
  
  // Remove function return type annotations
  content = content.replace(/\): void \{/g, ') {');
  content = content.replace(/\): Promise<void> \{/g, ') {');
  content = content.replace(/\): string \{/g, ') {');
  content = content.replace(/\): any \{/g, ') {');
  
  // Remove parameter type annotations in functions
  content = content.replace(/\(([^)]*): HTMLTextAreaElement([^)]*)\)/g, '($1$2)');
  content = content.replace(/\(([^)]*): HTMLElement([^)]*)\)/g, '($1$2)');
  content = content.replace(/\(([^)]*): Document([^)]*)\)/g, '($1$2)');
  content = content.replace(/\(([^)]*): string([^)]*)\)/g, '($1$2)');
  content = content.replace(/\(([^)]*): MimeType\[\]([^)]*)\)/g, '($1$2)');
  content = content.replace(/function (\w+)\((\w+): (\w+)\)/g, 'function $1($2)');
  content = content.replace(/function (\w+)\((\w+): (\w+), (\w+): (\w+)\)/g, 'function $1($2, $4)');
  
  // Remove type declarations for variables
  content = content.replace(/: Document \| null/g, '');
  content = content.replace(/: UnicodeCharacter\[\]/g, '');
  content = content.replace(/: MimeType\[\]/g, '');
  content = content.replace(/: \{ \[key: string\]: string \}/g, '');
  content = content.replace(/: \{ \[key: string\]: any \}/g, '');
  
  // Remove non-null assertions
  content = content.replace(/validation\.parsed!/g, 'validation.parsed');
  content = content.replace(/validation\.doc!/g, 'validation.doc');
  
  // Fix specific lines
  content = content.replace(/let currentXMLDoc: Document \| null = null;/g, 'let currentXMLDoc = null;');
  content = content.replace(/const characters: UnicodeCharacter\[\] = \[\];/g, 'const characters = [];');
  content = content.replace(/let allCharacters: UnicodeCharacter\[\] = \[\];/g, 'let allCharacters = [];');
  content = content.replace(/let displayedCharacters: UnicodeCharacter\[\] = \[\];/g, 'let displayedCharacters = [];');
  content = content.replace(/let filteredCharacters: UnicodeCharacter\[\] = \[\];/g, 'let filteredCharacters = [];');
  content = content.replace(/const templates: \{ \[key: string\]: any \} = \{/g, 'const templates = {');
  
  // Fix window type assertions
  content = content.replace(/\(window as any\)/g, 'window');
  
  // Fix error handling
  content = content.replace(/\(error as Error\)/g, 'error');
  
  return content;
}

// Process each file
files.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  console.log(`📝 Processing: ${file}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  const fixed = fixTypeScriptSyntax(content);
  
  if (content !== fixed) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`✓ No changes needed: ${file}`);
  }
});

console.log('\n✨ TypeScript syntax fixing complete!');