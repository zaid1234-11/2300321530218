const TOKEN = process.env.API_TOKEN || '';

async function test() {
  const url = 'http://4.224.186.213/evaluation-service/notifications';
  
  // test 1: Authorization header as-is
  console.log('Test 1: Bearer token in Authorization header');
  let res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${TOKEN}` },
  });
  console.log(`  Status: ${res.status}`);
  if (!res.ok) console.log(`  Body: ${await res.text()}`);

  // test 2: just the token without Bearer prefix
  console.log('\nTest 2: Token without Bearer prefix');
  res = await fetch(url, {
    headers: { 'Authorization': TOKEN },
  });
  console.log(`  Status: ${res.status}`);
  if (!res.ok) console.log(`  Body: ${await res.text()}`);

  // test 3: token in query param
  console.log('\nTest 3: Token as query param');
  res = await fetch(`${url}?token=${TOKEN}`);
  console.log(`  Status: ${res.status}`);
  if (!res.ok) console.log(`  Body: ${await res.text()}`);

  // test 4: POST with clientID/clientSecret to get fresh token
  console.log('\nTest 4: Register/auth endpoint');
  try {
    res = await fetch('http://4.224.186.213/evaluation-service/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'zaid.23b1531157@abes.ac.in',
        name: 'zaid saifi',
        rollNo: '2300321530218',
        accessCode: 'cXuqht',
        clientID: '9ac7d668-78b0-44bb-9a8e-b3e954a55fa1',
        clientSecret: 'EAzwpDRPTscQFGsw',
      }),
    });
    console.log(`  Status: ${res.status}`);
    const body = await res.text();
    console.log(`  Body: ${body.substring(0, 500)}`);
  } catch (e) {
    console.log(`  Failed: ${e.message}`);
  }
}

test();
