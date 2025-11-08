const fetch = global.fetch || require('node-fetch');
(async () => {
  const base = 'http://localhost:5000';
  try {
    console.log('Registering test user...');
    const regRes = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'E2E Test',
        email: 'e2e.user@example.com',
        organization: 'E2E',
        designation: 'Tester',
        password: 'e2epass'
      })
    });
    let regBody;
    try { regBody = await regRes.json(); } catch (e) { regBody = await regRes.text(); }
    console.log('register status', regRes.status);
    console.log('register body:', JSON.stringify(regBody));

    console.log('\nLogging in as admin...');
    const adminRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@example.com', password: 'admin123' })
    });
    let adminBody; try { adminBody = await adminRes.json(); } catch (e) { adminBody = await adminRes.text(); }
    console.log('admin login status', adminRes.status);
    console.log('admin body:', JSON.stringify(adminBody));
    const adminToken = adminBody.token;

    let userId;
    if (regBody && regBody.data && regBody.data.user && (regBody.data.user.id || regBody.data.user._id)) {
      userId = regBody.data.user.id || regBody.data.user._id;
    }

    if (!userId) {
      console.log('Fetching pending users to find the created user...');
      const pendingRes = await fetch(base + '/api/admin/pending-users', {
        headers: { Authorization: 'Bearer ' + adminToken }
      });
      let pendingBody; try { pendingBody = await pendingRes.json(); } catch (e) { pendingBody = await pendingRes.text(); }
      console.log('pending status', pendingRes.status);
      console.log('pending body:', JSON.stringify(pendingBody));
      if (pendingBody && Array.isArray(pendingBody.data) && pendingBody.data.length > 0) {
        const found = pendingBody.data.find(u => u.email === 'e2e.user@example.com');
        if (found) userId = found._id || found.id;
        else userId = pendingBody.data[0]._id || pendingBody.data[0].id;
      }
    }

    console.log('Target userId:', userId);
    if (!userId) { console.error('User ID not found; aborting.'); process.exit(1); }

    console.log('\nApproving user...');
    const approveRes = await fetch(base + '/api/admin/approve-user/' + userId, {
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + adminToken }
    });
    let approveBody; try { approveBody = await approveRes.json(); } catch (e) { approveBody = await approveRes.text(); }
    console.log('approve status', approveRes.status);
    console.log('approve body:', JSON.stringify(approveBody));

    console.log('\nLogging in as approved user...');
    const userLoginRes = await fetch(base + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'e2e.user@example.com', password: 'e2epass' })
    });
    let userLoginBody; try { userLoginBody = await userLoginRes.json(); } catch (e) { userLoginBody = await userLoginRes.text(); }
    console.log('user login status', userLoginRes.status);
    console.log('user login body:', JSON.stringify(userLoginBody));

    const userToken = userLoginBody.token;
    console.log('\nCalling /api/auth/me with user token...');
    const meRes = await fetch(base + '/api/auth/me', { headers: { Authorization: 'Bearer ' + userToken } });
    let meBody; try { meBody = await meRes.json(); } catch (e) { meBody = await meRes.text(); }
    console.log('/me status', meRes.status);
    console.log('/me body:', JSON.stringify(meBody));

    console.log('\nE2E script completed.');
  } catch (err) {
    console.error('E2E ERROR', err);
    process.exit(1);
  }
})();
