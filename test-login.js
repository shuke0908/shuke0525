const fetch = require('node-fetch');

async function testLogin() {
  try {
    console.log('🧪 Testing login API...');
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'shuke0525',
        password: 'michael112'
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('📊 Response data:', data);

    if (response.ok) {
      console.log('✅ Login successful!');
    } else {
      console.log('❌ Login failed!');
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testLogin(); 