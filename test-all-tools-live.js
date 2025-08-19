#!/usr/bin/env node

// Comprehensive live testing for ALL 55+ tools

const allTools = [
  // Core Utilities
  'json', 'base64', 'uuid', 'hash', 'password', 'timestamp', 'diff', 
  'markdown', 'regex', 'jwt',
  
  // Security & Encryption
  'encryption', 'bcrypt', 'rsa', 'pgp', 'aes', 'cert', 'ssl',
  
  // Text & Format
  'lorem', 'word-counter', 'text-stats', 'case', 'escape', 'ascii-art',
  
  // Data Format
  'yaml', 'xml', 'csv', 'sql',
  
  // Developer Tools
  'http', 'hex', 'binary', 'color', 'qr', 'barcode', 'mime', 'unicode',
  
  // Network Tools
  'dns', 'ip', 'ports', 'webhook',
  
  // Converters
  'unit', 'number-base', 'date-format',
  
  // Validators
  'email-validator', 'url-validator', 'credit-card',
  
  // Generators
  'ssh-key', 'cron', 'htpasswd',
  
  // Misc Tools
  'minify', 'prettify', 'html-entities', 'js-formatter', 'css-formatter'
];

async function testTool(toolName) {
  const url = `http://localhost:4321/tools/${toolName}`;
  
  try {
    const response = await fetch(url);
    const status = response.status;
    
    if (status === 200) {
      const html = await response.text();
      const hasInput = /<input|<textarea/i.test(html);
      const hasButton = /<button/i.test(html);
      const hasPrivacy = /privacy-badge|client-side/i.test(html);
      const hasScript = /<script/i.test(html);
      
      return {
        tool: toolName,
        status: 'OK',
        code: status,
        size: html.length,
        hasInput,
        hasButton,
        hasPrivacy,
        hasScript
      };
    } else {
      return {
        tool: toolName,
        status: 'ERROR',
        code: status,
        size: 0,
        hasInput: false,
        hasButton: false,
        hasPrivacy: false,
        hasScript: false
      };
    }
  } catch (error) {
    return {
      tool: toolName,
      status: 'FAILED',
      code: 0,
      error: error.message,
      size: 0,
      hasInput: false,
      hasButton: false,
      hasPrivacy: false,
      hasScript: false
    };
  }
}

async function testAllTools() {
  console.log('🚀 Testing ALL Developer Tools');
  console.log('=' .repeat(60));
  console.log(`Total tools to test: ${allTools.length}`);
  console.log('');
  
  const results = [];
  
  // Test each tool
  for (const tool of allTools) {
    process.stdout.write(`Testing ${tool}...`);
    const result = await testTool(tool);
    results.push(result);
    
    if (result.status === 'OK') {
      console.log(` ✅ ${result.code} (${result.size} bytes)`);
    } else if (result.status === 'ERROR') {
      console.log(` ❌ ${result.code}`);
    } else {
      console.log(` 💥 Failed: ${result.error}`);
    }
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));
  
  const working = results.filter(r => r.status === 'OK');
  const errors = results.filter(r => r.status === 'ERROR');
  const failed = results.filter(r => r.status === 'FAILED');
  
  console.log(`✅ Working: ${working.length}/${allTools.length}`);
  console.log(`❌ Errors: ${errors.length}/${allTools.length}`);
  console.log(`💥 Failed: ${failed.length}/${allTools.length}`);
  
  if (errors.length > 0) {
    console.log('\n🔴 Tools with errors:');
    errors.forEach(r => {
      console.log(`  - ${r.tool}: HTTP ${r.code}`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n💥 Tools that failed to connect:');
    failed.forEach(r => {
      console.log(`  - ${r.tool}: ${r.error}`);
    });
  }
  
  // Check for missing features
  console.log('\n🔍 Feature Analysis:');
  const missingInput = working.filter(r => !r.hasInput);
  const missingButton = working.filter(r => !r.hasButton);
  const missingPrivacy = working.filter(r => !r.hasPrivacy);
  const missingScript = working.filter(r => !r.hasScript);
  
  if (missingInput.length > 0) {
    console.log(`⚠️  Tools without input fields: ${missingInput.map(r => r.tool).join(', ')}`);
  }
  if (missingButton.length > 0) {
    console.log(`⚠️  Tools without buttons: ${missingButton.map(r => r.tool).join(', ')}`);
  }
  if (missingPrivacy.length > 0) {
    console.log(`⚠️  Tools without privacy badge: ${missingPrivacy.map(r => r.tool).join(', ')}`);
  }
  if (missingScript.length > 0) {
    console.log(`⚠️  Tools without JavaScript: ${missingScript.map(r => r.tool).join(', ')}`);
  }
  
  return results;
}

// Run the tests
testAllTools().catch(console.error);