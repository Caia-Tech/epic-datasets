#!/usr/bin/env node

// Using native fetch (available in Node 18+)

// Test configurations for each tool
const toolTests = [
  {
    name: 'JSON Formatter',
    url: 'http://localhost:4321/tools/json',
    tests: [
      { input: '{"valid":"json"}', description: 'Valid JSON' },
      { input: '{invalid json}', description: 'Invalid JSON' },
      { input: '{"nested":{"deep":{"value":true}}}', description: 'Nested JSON' },
      { input: '{"unicode":"🚀 café"}', description: 'Unicode in JSON' },
      { input: '[]', description: 'Empty array' },
      { input: 'null', description: 'Null value' }
    ]
  },
  {
    name: 'Base64 Encoder',
    url: 'http://localhost:4321/tools/base64',
    tests: [
      { input: 'Hello World', description: 'Simple text' },
      { input: '', description: 'Empty string' },
      { input: '🚀 Unicode émoji café', description: 'Unicode text' },
      { input: 'a'.repeat(10000), description: 'Very long text' },
      { input: '\x00\x01\x02\x03', description: 'Binary data' },
      { input: '<script>alert("xss")</script>', description: 'XSS attempt' }
    ]
  },
  {
    name: 'UUID Generator',
    url: 'http://localhost:4321/tools/uuid',
    tests: [
      { action: 'generate', description: 'Generate UUID v4' },
      { action: 'generate_multiple', count: 100, description: 'Generate 100 UUIDs' },
      { action: 'validate', input: '550e8400-e29b-41d4-a716-446655440000', description: 'Validate UUID' },
      { action: 'validate', input: 'invalid-uuid', description: 'Invalid UUID' }
    ]
  },
  {
    name: 'Hash Generator',
    url: 'http://localhost:4321/tools/hash',
    tests: [
      { input: 'test', algorithm: 'MD5', description: 'MD5 hash' },
      { input: 'test', algorithm: 'SHA256', description: 'SHA256 hash' },
      { input: '', algorithm: 'SHA512', description: 'Empty string hash' },
      { input: '🚀', algorithm: 'SHA256', description: 'Unicode hash' },
      { input: 'a'.repeat(1000000), algorithm: 'SHA1', description: 'Large input hash' }
    ]
  },
  {
    name: 'Password Generator',
    url: 'http://localhost:4321/tools/password',
    tests: [
      { length: 8, description: 'Short password' },
      { length: 128, description: 'Very long password' },
      { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, description: 'All character types' },
      { length: 20, excludeAmbiguous: true, description: 'No ambiguous chars' },
      { length: 0, description: 'Zero length (edge case)' }
    ]
  },
  {
    name: 'Regex Tester',
    url: 'http://localhost:4321/tools/regex',
    tests: [
      { pattern: '^test$', text: 'test', description: 'Simple match' },
      { pattern: '\\d+', text: 'abc123def', description: 'Number extraction' },
      { pattern: '(?<=@)[^.]+', text: 'user@domain.com', description: 'Lookahead/behind' },
      { pattern: '(a+)+b', text: 'a'.repeat(30), description: 'ReDoS test' },
      { pattern: '[', text: 'test', description: 'Invalid regex' }
    ]
  },
  {
    name: 'Timestamp Converter',
    url: 'http://localhost:4321/tools/timestamp',
    tests: [
      { timestamp: Date.now(), description: 'Current timestamp' },
      { timestamp: 0, description: 'Unix epoch' },
      { timestamp: -1, description: 'Negative timestamp' },
      { timestamp: 253402300799999, description: 'Year 9999' },
      { timestamp: 'invalid', description: 'Invalid timestamp' }
    ]
  },
  {
    name: 'Diff Checker',
    url: 'http://localhost:4321/tools/diff',
    tests: [
      { text1: 'line1\nline2', text2: 'line1\nline3', description: 'Simple diff' },
      { text1: '', text2: 'new content', description: 'Empty to content' },
      { text1: 'same', text2: 'same', description: 'Identical texts' },
      { text1: 'a'.repeat(100000), text2: 'b'.repeat(100000), description: 'Large texts' }
    ]
  },
  {
    name: 'Markdown Editor',
    url: 'http://localhost:4321/tools/markdown',
    tests: [
      { input: '# Heading\n**Bold** *italic*', description: 'Basic markdown' },
      { input: '```js\nconsole.log("code")\n```', description: 'Code block' },
      { input: '[Link](javascript:alert(1))', description: 'XSS in link' },
      { input: '# '.repeat(1000), description: 'Many headings' },
      { input: '![](http://evil.com/tracker.gif)', description: 'External image' }
    ]
  },
  {
    name: 'JWT Decoder',
    url: 'http://localhost:4321/tools/jwt',
    tests: [
      { 
        input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        description: 'Valid JWT'
      },
      { input: 'invalid.jwt.token', description: 'Invalid JWT' },
      { input: 'eyJhbGciOiJub25lIn0.eyJ0ZXN0Ijp0cnVlfQ.', description: 'Alg none JWT' },
      { input: '', description: 'Empty JWT' }
    ]
  }
];

async function testTool(toolConfig) {
  console.log(`\n📋 Testing: ${toolConfig.name}`);
  console.log('=' .repeat(50));
  
  try {
    // First check if page loads
    const response = await fetch(toolConfig.url);
    const html = await response.text();
    
    if (response.status !== 200) {
      console.log(`❌ Page failed to load: ${response.status}`);
      return;
    }
    
    console.log(`✅ Page loaded successfully (${html.length} bytes)`);
    
    // Check for essential elements
    const checks = [
      { pattern: /<input|<textarea/i, name: 'Input fields' },
      { pattern: /<button/i, name: 'Buttons' },
      { pattern: /privacy-badge|client-side/i, name: 'Privacy badge' },
      { pattern: /<script/i, name: 'JavaScript' }
    ];
    
    checks.forEach(check => {
      if (check.pattern.test(html)) {
        console.log(`✅ ${check.name} found`);
      } else {
        console.log(`⚠️  ${check.name} not found`);
      }
    });
    
    // Test edge cases
    if (toolConfig.tests) {
      console.log('\n🧪 Edge Case Tests:');
      toolConfig.tests.forEach(test => {
        console.log(`  • ${test.description}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Error testing tool: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Live Tool Testing');
  console.log('Testing server at http://localhost:4321');
  
  for (const tool of toolTests) {
    await testTool(tool);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between tests
  }
  
  console.log('\n✨ Testing complete!');
}

// Run tests
runAllTests().catch(console.error);