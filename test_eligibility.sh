#!/bin/bash

# Test script untuk menguji API kelayakan cuti
echo "🔍 Testing Leave Eligibility API..."

# Extract token from cookies
TOKEN=$(grep -o '"token":"[^"]*"' .syed_cookies | cut -d'"' -f4)
EMPLOYEE_ID="e74d71b5-128e-442d-a0c4-c050479b1a50"
BASE_URL="http://localhost:5000"

if [ -z "$TOKEN" ]; then
    echo "❌ No token found in .syed_cookies"
    exit 1
fi

echo "✅ Token found: ${TOKEN:0:20}..."

# Test 1: Get current eligibility for employee
echo -e "\n1. Testing GET eligibility for employee..."
curl -s -X GET "${BASE_URL}/api/leave-eligibility/${EMPLOYEE_ID}" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# Test 2: Set eligibility (disable Annual Leave)
echo -e "\n2. Testing POST - Disable Annual Leave..."
curl -s -X POST "${BASE_URL}/api/leave-eligibility" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$EMPLOYEE_ID'",
    "leaveType": "Annual Leave",
    "isEligible": false,
    "remarks": "Testing - Temporarily disabled for demo"
  }' | jq '.'

# Test 3: Check specific leave eligibility  
echo -e "\n3. Testing GET specific leave eligibility..."
curl -s -X GET "${BASE_URL}/api/leave-eligibility/${EMPLOYEE_ID}/Annual%20Leave" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq '.'

# Test 4: Re-enable Annual Leave
echo -e "\n4. Testing POST - Re-enable Annual Leave..."
curl -s -X POST "${BASE_URL}/api/leave-eligibility" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "'$EMPLOYEE_ID'",
    "leaveType": "Annual Leave",
    "isEligible": true,
    "remarks": null
  }' | jq '.'

echo -e "\n✅ Test completed!"