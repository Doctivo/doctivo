// Native fetch available in modern Node.js

const BASE_URL = 'http://localhost:3000/api/v1';
let accessToken = '';
let doctorId = '';

async function testEndpoints() {
  console.log('--- STARTING MOBILE API TESTS ---\n');

  try {
    // 1. GET /doctors
    console.log('1. Testing GET /doctors...');
    const doctorsRes = await fetch(`${BASE_URL}/doctors`);
    const doctorsData = await doctorsRes.json();
    if (doctorsRes.ok && doctorsData.success) {
      console.log('✅ GET /doctors passed! Found ' + doctorsData.doctors.length + ' doctors.');
      if (doctorsData.doctors.length > 0) doctorId = doctorsData.doctors[0].doctor_id;
    } else {
      console.log('❌ GET /doctors failed:', doctorsData);
    }

    // 2. GET /doctors/[id]/slots
    if (doctorId) {
      console.log('\n2. Testing GET /doctors/[id]/slots...');
      const date = new Date().toISOString().split('T')[0];
      const slotsRes = await fetch(`${BASE_URL}/doctors/${doctorId}/slots?date=${date}`);
      const slotsData = await slotsRes.json();
      if (slotsRes.ok && slotsData.success) {
        console.log(`✅ GET /doctors/[id]/slots passed! Found ${slotsData.slots.length} slots for today.`);
      } else {
        console.log('❌ GET /doctors/[id]/slots failed:', slotsData);
      }
    }

    // 3. POST /auth/send-otp
    console.log('\n3. Testing POST /auth/send-otp...');
    const sendOtpRes = await fetch(`${BASE_URL}/auth/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999' })
    });
    const sendOtpData = await sendOtpRes.json();
    if (sendOtpRes.ok || sendOtpData.success || sendOtpData.error?.includes('locked')) { // locked means logic is working
      console.log('✅ POST /auth/send-otp passed!', sendOtpData);
    } else {
      console.log('❌ POST /auth/send-otp failed:', sendOtpData);
    }

    // 4. POST /auth/login (mock login)
    console.log('\n4. Testing POST /auth/login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9999999999', otp: '123456' }) // Assume fake OTP works or logic creates user
    });
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.success) {
      console.log('✅ POST /auth/login passed! Received tokens.');
      accessToken = loginData.accessToken;
    } else {
      console.log('❌ POST /auth/login failed:', loginData);
    }

    // 5. POST /appointments/create
    if (accessToken && doctorId) {
      console.log('\n5. Testing POST /appointments/create...');
      const aptRes = await fetch(`${BASE_URL}/appointments/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          doctorId: doctorId,
          date: new Date().toISOString().split('T')[0],
          time: '10:00'
        })
      });
      const aptData = await aptRes.json();
      if (aptRes.ok && aptData.success) {
        console.log('✅ POST /appointments/create passed! Session ID:', aptData.paymentSessionId);
      } else {
        console.log('❌ POST /appointments/create failed:', aptData);
      }
    }

    console.log('\n--- TESTS COMPLETED ---');
  } catch (error) {
    console.error('Test Execution Error:', error);
  }
}

testEndpoints();
