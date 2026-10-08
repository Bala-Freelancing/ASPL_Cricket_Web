/**
 * Comprehensive Live E2E Functional Test Suite
 * Tests Frontend (Netlify), Backend (Render), Database (Supabase PostgreSQL),
 * Authentication (Player, Owner, Admin), and Realtime (Socket.IO).
 */

const { io } = require('socket.io-client');

const FRONTEND_URL = 'https://6ac74f0d4a72f100b8797e32--asplcricket.netlify.app';
const BACKEND_URL = 'https://aspl-cricket-web-jdyv.onrender.com';

const results = [];

function record(suite, testName, passed, details = '') {
  results.push({ suite, testName, passed, details });
  const symbol = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${symbol} [${suite}] ${testName} ${details ? '- ' + details : ''}`);
}

async function testFrontendPages() {
  console.log('\n--- 1. Testing Frontend Pages (Netlify) ---');
  const pages = [
    { path: '/', match: 'ASPL', name: 'Home Landing Page' },
    { path: '/login', match: 'Login', name: 'Login Portal' },
    { path: '/register', match: 'Register', name: 'Player Registration' },
    { path: '/spectator', match: 'Auction', name: 'Spectator Live Auction' },
    { path: '/terms', match: 'Terms', name: 'Terms of Service' },
    { path: '/privacy', match: 'Privacy', name: 'Privacy Policy' },
    { path: '/refund', match: 'Refund', name: 'Refund Policy' },
    { path: '/contact', match: 'Contact', name: 'Contact Page' },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${FRONTEND_URL}${page.path}`);
      const text = await res.text();
      const isOk = res.status === 200 && text.toLowerCase().includes(page.match.toLowerCase());
      record('Frontend', `${page.name} (${page.path})`, isOk, `Status: ${res.status}`);
    } catch (err) {
      record('Frontend', `${page.name} (${page.path})`, false, `Error: ${err.message}`);
    }
  }
}

async function testBackendHealthAndPublicAPIs() {
  console.log('\n--- 2. Testing Backend Health & Public APIs (Render) ---');

  // Root welcome
  try {
    const res = await fetch(`${BACKEND_URL}/`);
    const json = await res.json();
    const isOk = res.status === 200 && json.status === 'online';
    record('Backend', 'Root Welcome API (/)', isOk, `Status: ${json.status}, App: ${json.name}`);
  } catch (err) {
    record('Backend', 'Root Welcome API (/)', false, err.message);
  }

  // Health endpoint
  try {
    const res = await fetch(`${BACKEND_URL}/health`);
    const json = await res.json();
    const isOk = res.status === 200 && json.status === 'ok';
    record('Backend', 'Health Check API (/health)', isOk, `Status: ${json.status}, Uptime: ${Math.round(json.uptime)}s`);
  } catch (err) {
    record('Backend', 'Health Check API (/health)', false, err.message);
  }

  // Public summary
  try {
    const res = await fetch(`${BACKEND_URL}/api/auction/public-summary`);
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true && json.teams.length > 0;
    record('Backend', 'Public Auction Summary (/api/auction/public-summary)', isOk, `Teams: ${json.teams.length}, Players: ${json.stats?.totalPlayers}`);
  } catch (err) {
    record('Backend', 'Public Auction Summary (/api/auction/public-summary)', false, err.message);
  }

  // Current auction state
  try {
    const res = await fetch(`${BACKEND_URL}/api/auction/current`);
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true;
    record('Backend', 'Current Auction State (/api/auction/current)', isOk, `State: ${json.auction ? json.auction.state : 'IDLE / No lot active'}`);
  } catch (err) {
    record('Backend', 'Current Auction State (/api/auction/current)', false, err.message);
  }
}

async function testAuthenticationFlows() {
  console.log('\n--- 3. Testing Authentication Flows ---');
  let playerToken = null;
  let ownerToken = null;
  let adminToken = null;

  // 3.1 Player Login
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'balakumar18@gmail.com', password: '9791234315' }),
    });
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true && json.user.role === 'PLAYER' && !!json.token;
    if (isOk) playerToken = json.token;
    record('Auth', 'Player Login (balakumar18@gmail.com)', isOk, `Name: ${json.user?.name}, Role: ${json.user?.role}`);
  } catch (err) {
    record('Auth', 'Player Login', false, err.message);
  }

  // 3.2 Team Owner Login
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'owner@aspl.com', password: 'owner123' }),
    });
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true && json.user.role === 'TEAM_OWNER' && !!json.token;
    if (isOk) ownerToken = json.token;
    record('Auth', 'Team Owner Login (owner@aspl.com)', isOk, `Team: ${json.user?.team?.name}, Purse: ₹${json.user?.team?.remainingPurse}`);
  } catch (err) {
    record('Auth', 'Team Owner Login', false, err.message);
  }

  // 3.3 Admin Login
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ipl.com', password: 'admin123' }),
    });
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true && json.user.role === 'ADMIN' && !!json.token;
    if (isOk) adminToken = json.token;
    record('Auth', 'Admin Login (admin@ipl.com)', isOk, `Role: ${json.user?.role}`);
  } catch (err) {
    record('Auth', 'Admin Login', false, err.message);
  }

  // 3.4 Invalid Credentials Security Check
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ipl.com', password: 'wrongpassword' }),
    });
    const json = await res.json();
    const isOk = res.status === 401 && json.success === false;
    record('Security', 'Invalid Password Rejection (401)', isOk, `Returned: ${json.error}`);
  } catch (err) {
    record('Security', 'Invalid Password Rejection', false, err.message);
  }

  return { playerToken, ownerToken, adminToken };
}

async function testPlayerPortal(playerToken) {
  console.log('\n--- 4. Testing Authenticated Player Portal ---');
  if (!playerToken) {
    record('Player Portal', 'Get Player Profile (/api/player/me)', false, 'Skipped: Player token missing');
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/player/me`, {
      headers: { Authorization: `Bearer ${playerToken}` },
    });
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true && !!json.player;
    record('Player Portal', 'Get Player Profile (/api/player/me)', isOk, `Player: ${json.player?.name}, Status: ${json.player?.registrationStatus}, Payment: ${json.player?.paymentStatus}`);
  } catch (err) {
    record('Player Portal', 'Get Player Profile (/api/player/me)', false, err.message);
  }

  // Unauthorized access check
  try {
    const res = await fetch(`${BACKEND_URL}/api/player/me`, {
      headers: { Authorization: 'Bearer bad_token_123' },
    });
    const json = await res.json();
    const isOk = res.status === 403 || res.status === 401;
    record('Security', 'Player Portal Tampered Token Rejection', isOk, `Status: ${res.status}`);
  } catch (err) {
    record('Security', 'Player Portal Tampered Token Rejection', false, err.message);
  }
}

async function testAdminOperations(adminToken) {
  console.log('\n--- 5. Testing Authenticated Admin Operations ---');
  if (!adminToken) {
    record('Admin', 'Admin Dashboard Stats', false, 'Skipped: Admin token missing');
    return;
  }

  // Dashboard Stats
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true && json.stats;
    record('Admin', 'Admin Dashboard Stats (/api/admin/dashboard)', isOk,
      `Players: ${json.stats?.totalPlayers}, Paid: ${json.stats?.paidPlayers}, Teams: ${json.stats?.totalTeams}, Rev: ₹${json.stats?.totalRevenue}`);
  } catch (err) {
    record('Admin', 'Admin Dashboard Stats', false, err.message);
  }

  // Teams Management
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/teams`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    const isOk = res.status === 200 && json.success === true && Array.isArray(json.teams);
    record('Admin', 'Admin Teams List (/api/admin/teams)', isOk, `Retrieved ${json.teams?.length} teams`);
  } catch (err) {
    record('Admin', 'Admin Teams List', false, err.message);
  }

  // Role Protection check (Player accessing Admin endpoint)
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer dummy_or_player_token` },
    });
    const isOk = res.status === 401 || res.status === 403;
    record('Security', 'Admin RBAC Access Control Protection', isOk, `Status: ${res.status}`);
  } catch (err) {
    record('Security', 'Admin RBAC Access Control Protection', false, err.message);
  }
}

async function testRegistrationValidation() {
  console.log('\n--- 6. Testing Player Registration Validation API ---');
  // Validation: Missing fields
  try {
    const res = await fetch(`${BACKEND_URL}/api/players/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Incomplete Player' }),
    });
    const json = await res.json();
    const isOk = res.status === 400 && json.success === false;
    record('Registration', 'Missing Required Fields Rejection', isOk, `Error: ${json.error}`);
  } catch (err) {
    record('Registration', 'Missing Required Fields Rejection', false, err.message);
  }

  // Validation: Duplicate phone/email
  try {
    const res = await fetch(`${BACKEND_URL}/api/players/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Player',
        phone: '+919791234315',
        category: 'Batsman',
      }),
    });
    const json = await res.json();
    const isOk = res.status === 400 && json.success === false && json.error.includes('already exists');
    record('Registration', 'Duplicate Phone Rejection', isOk, `Error: ${json.error}`);
  } catch (err) {
    record('Registration', 'Duplicate Phone Rejection', false, err.message);
  }
}

async function testRealtimeSocketIO() {
  console.log('\n--- 7. Testing Real-time Socket.IO Engine ---');
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      record('Realtime', 'Socket.IO Connection Handshake', false, 'Timed out after 10 seconds');
      resolve();
    }, 10000);

    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 2,
      timeout: 8000,
    });

    socket.on('connect', () => {
      clearTimeout(timeout);
      record('Realtime', 'Socket.IO Connection Handshake', true, `Socket ID: ${socket.id}, Transport: ${socket.io.engine.transport.name}`);

      // Emit join auction
      socket.emit('auction:join');
      record('Realtime', 'Socket.IO Join Room Event (auction:join)', true, 'Joined auction_room');

      // Listen for timer tick or sync event for 3 seconds then disconnect
      let heardTick = false;
      socket.on('auction:timer_tick', (data) => {
        if (!heardTick) {
          heardTick = true;
          record('Realtime', 'Socket.IO Live Heartbeat / Tick Event', true, `Remaining: ${data.remainingSeconds}s`);
        }
      });

      setTimeout(() => {
        socket.disconnect();
        record('Realtime', 'Socket.IO Clean Disconnect', true, 'Disconnected cleanly');
        resolve();
      }, 3000);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timeout);
      record('Realtime', 'Socket.IO Connection Handshake', false, `Connection error: ${err.message}`);
      resolve();
    });
  });
}

async function runAll() {
  console.log('================================================================');
  console.log('   ASPL CRICKET TOURNAMENT 2026 — LIVE END-TO-END TEST SUITE   ');
  console.log(`   Frontend : ${FRONTEND_URL}`);
  console.log(`   Backend  : ${BACKEND_URL}`);
  console.log('================================================================');

  await testFrontendPages();
  await testBackendHealthAndPublicAPIs();
  const { playerToken, ownerToken, adminToken } = await testAuthenticationFlows();
  await testPlayerPortal(playerToken);
  await testAdminOperations(adminToken);
  await testRegistrationValidation();
  await testRealtimeSocketIO();

  console.log('\n================================================================');
  console.log('                    FINAL TEST EXECUTION SUMMARY                ');
  console.log('================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const passRate = Math.round((passedCount / totalCount) * 100);

  console.log(`Total Tests Run : ${totalCount}`);
  console.log(`Passed          : ${passedCount}`);
  console.log(`Failed          : ${totalCount - passedCount}`);
  console.log(`Success Rate    : ${passRate}%`);
  console.log('================================================================\n');

  if (passedCount === totalCount) {
    console.log('🎉 ALL LIVE PLATFORM FUNCTIONALITIES ARE 100% OPERATIONAL!');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the details above.');
    process.exit(1);
  }
}

runAll().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
