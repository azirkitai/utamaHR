// Test script untuk menguji API kelayakan cuti
const fetch = require('node-fetch');
const fs = require('fs');

// Read token from cookies file
let token = '';
try {
  const cookieContent = fs.readFileSync('.syed_cookies', 'utf8');
  const tokenMatch = cookieContent.match(/"token":"([^"]+)"/);
  if (tokenMatch) {
    token = tokenMatch[1];
  }
} catch (error) {
  console.error('Error reading cookies:', error.message);
}

const baseURL = 'http://localhost:5000';
const employeeId = 'e74d71b5-128e-442d-a0c4-c050479b1a50'; // kamal ludin

async function testAPI() {
  try {
    console.log('🔍 Testing Leave Eligibility API...');
    
    // Test 1: Get current eligibility for employee
    console.log('\n1. Testing GET eligibility for employee...');
    const response1 = await fetch(`${baseURL}/api/leave-eligibility/${employeeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
    
    // Test 2: Set eligibility (disable Annual Leave)
    console.log('\n2. Testing POST - Disable Annual Leave...');
    const response2 = await fetch(`${baseURL}/api/leave-eligibility`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employeeId: employeeId,
        leaveType: 'Annual Leave',
        isEligible: false,
        remarks: 'Testing - Temporarily disabled for demo'
      })
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    // Test 3: Check specific leave eligibility
    console.log('\n3. Testing GET specific leave eligibility...');
    const response3 = await fetch(`${baseURL}/api/leave-eligibility/${employeeId}/Annual Leave`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testAPI();