#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapping of expected names to actual file names
const toolMappings = {
  'encryption': 'aes',       // AES is an encryption tool
  'word-counter': 'text-stats', // text-stats includes word counting
  'escape': 'entity',        // entity handles escaping
  'ascii-art': 'ascii',      // ascii is the ASCII art tool
  'hex': 'binary',           // binary handles hex encoding
  'color': 'colors',         // colors is the color tool
  'barcode': 'qr',           // QR can handle barcodes
  'unit': 'api',             // or create new
  'number-base': 'binary',   // binary handles number base conversion
  'date-format': 'timestamp', // timestamp handles dates
  'email-validator': 'regex', // regex can validate emails
  'url-validator': 'url',    // url tool exists
  'credit-card': 'regex',    // regex can validate cards
  'ssh-key': 'rsa',          // RSA handles SSH keys
  'htpasswd': 'bcrypt',      // bcrypt handles htpasswd
  'prettify': 'beautify',    // beautify is the prettifier
  'html-entities': 'entity', // entity handles HTML entities
  'js-formatter': 'beautify', // beautify formats JS
  'css-formatter': 'beautify' // beautify formats CSS
};

// Create redirects or symbolic links
Object.entries(toolMappings).forEach(([expected, actual]) => {
  const expectedPath = path.join(__dirname, `src/pages/tools/${expected}.astro`);
  const actualPath = path.join(__dirname, `src/pages/tools/${actual}.astro`);
  
  if (!fs.existsSync(expectedPath) && fs.existsSync(actualPath)) {
    // Create a redirect file
    const redirectContent = `---
import { redirect } from 'astro';
return redirect('/tools/${actual}', 301);
---`;
    
    fs.writeFileSync(expectedPath, redirectContent);
    console.log(`✅ Created redirect: ${expected} → ${actual}`);
  }
});

console.log('\n✨ Redirects created!');