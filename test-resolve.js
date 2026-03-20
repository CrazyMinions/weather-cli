// Test resolveCity function
import { resolveCity } from './src/resolveCity.js';

async function test() {
  console.log('Testing resolveCity function...\n');
  
  // Test 1: Chinese city
  console.log('Test 1: Chinese city "北京"');
  try {
    const result1 = await resolveCity('北京');
    console.log(`Result: ${result1}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  
  // Test 2: English city
  console.log('\nTest 2: English city "Shanghai"');
  try {
    const result2 = await resolveCity('Shanghai');
    console.log(`Result: ${result2}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  
  // Test 3: Invalid city
  console.log('\nTest 3: Invalid city "INVALID_CITY_XYZ"');
  try {
    const result3 = await resolveCity('INVALID_CITY_XYZ');
    console.log(`Result: ${result3}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

test().catch(console.error);