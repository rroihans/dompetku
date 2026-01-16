import { Money } from '../src/lib/money';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Check Failed: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ Check Passed: ${message}`);
  }
}

console.log('--- Testing Money Utility ---');

// Test fromFloat
assert(Money.fromFloat(10000.50) === 1000050, 'fromFloat(10000.50) should be 1000050');
assert(Money.fromFloat(0.1 + 0.2) === 30, 'fromFloat(0.1 + 0.2) should handle floating point precision (30)');

// Test toFloat
assert(Money.toFloat(1000050) === 10000.50, 'toFloat(1000050) should be 10000.50');

// Test format
const formatted = Money.format(1000050);
// Note: formatted string might depend on system locale, checking basic parts
assert(formatted.includes('10.000,50') || formatted.includes('10.000,5'), `format(1000050) should resemble Rp 10.000,50. Got: ${formatted}`);

// Test add
assert(Money.add(100, 200) === 300, 'add(100, 200) should be 300');

// Test subtract
assert(Money.subtract(300, 100) === 200, 'subtract(300, 100) should be 200');

// Test multiply
assert(Money.multiply(1000, 0.5) === 500, 'multiply(1000, 0.5) should be 500');
assert(Money.multiply(100, 1/3) === 33, 'multiply(100, 1/3) should round correctly (33)');

console.log('--- All Tests Passed ---');
