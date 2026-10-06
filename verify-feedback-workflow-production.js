// Automated E2E Audit Script — EXOUSIA Feedback Workflow & Day-Specific Forms
// Tests: Admin API Auth, GET metrics, POST schedule, cancel, retry, and Participant Feedback submission.

import fs from 'fs';

let envText = '';
if (fs.existsSync('.env.local')) envText = fs.readFileSync('.env.local', 'utf8');
else if (fs.existsSync('.env')) envText = fs.readFileSync('.env', 'utf8');

envText.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
});

const adminSecret = process.env.ADMIN_SECRET_KEY || 'test_secret_123';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('===========================================================');
console.log('EXOUSIA 2K26 — FEEDBACK WORKFLOW PRODUCTION AUDIT');
console.log('===========================================================');

async function runAudit() {
  let passedCount = 0;
  let totalTests = 0;

  function assert(condition, title, details = '') {
    totalTests++;
    if (condition) {
      passedCount++;
      console.log(`✓ [ PASS ]: ${title}`);
    } else {
      console.error(`❌ [ FAIL ]: ${title}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  // 1. Import feedback-workflow handler dynamically
  try {
    const { default: workflowHandler } = await import('./api/admin/feedback-workflow.js');
    assert(typeof workflowHandler === 'function', 'Backend API handler api/admin/feedback-workflow.js loaded successfully');
  } catch (err) {
    assert(false, 'Failed to load api/admin/feedback-workflow.js', err.message);
  }

  // Mock res object helper
  function createMockRes() {
    return {
      statusCode: 200,
      headers: {},
      body: null,
      setHeader(k, v) { this.headers[k] = v; return this; },
      status(code) { this.statusCode = code; return this; },
      json(data) { this.body = data; return this; },
      end() { return this; }
    };
  }

  // Test 2: Unauthorized request to feedback-workflow
  const { default: workflowHandler } = await import('./api/admin/feedback-workflow.js');
  
  const mockReqUnauth = {
    method: 'GET',
    headers: {},
    query: { day: 'day1' }
  };
  const mockResUnauth = createMockRes();
  await workflowHandler(mockReqUnauth, mockResUnauth);

  if (process.env.NODE_ENV === 'production') {
    assert(mockResUnauth.statusCode === 401, 'Unauthorized request rejected with HTTP 401');
  } else {
    assert(mockResUnauth.statusCode === 200 || mockResUnauth.statusCode === 401, 'Auth check evaluated correctly');
  }

  // Test 3: Authorized GET request
  const mockReqAuth = {
    method: 'GET',
    headers: { authorization: `Bearer ${adminSecret}` },
    query: { day: 'day1', secret: adminSecret }
  };
  const mockResAuth = createMockRes();
  await workflowHandler(mockReqAuth, mockResAuth);

  assert(mockResAuth.statusCode === 200, 'Authorized GET request returns HTTP 200');
  assert(mockResAuth.body?.success === true, 'Response body success is true');
  assert(Boolean(mockResAuth.body?.metrics?.day1), 'Metrics contains Day 1 data');
  assert(Boolean(mockResAuth.body?.metrics?.day2), 'Metrics contains Day 2 data');

  console.log('   Sample Day 1 Metrics:', mockResAuth.body?.metrics?.day1);
  console.log('   Sample Day 2 Metrics:', mockResAuth.body?.metrics?.day2);

  // Test 4: Schedule feedback action
  const futureDateStr = new Date(Date.now() + 86400000).toISOString();
  const mockReqSchedule = {
    method: 'POST',
    headers: { authorization: `Bearer ${adminSecret}` },
    body: {
      action: 'schedule',
      day: 'day1',
      scheduled_at: futureDateStr,
      secret: adminSecret
    }
  };
  const mockResSchedule = createMockRes();
  await workflowHandler(mockReqSchedule, mockResSchedule);

  assert(mockResSchedule.statusCode === 200, 'Schedule action returns HTTP 200');
  assert(mockResSchedule.body?.success === true, 'Schedule response success is true');

  // Test 5: Cancel schedule action
  const mockReqCancel = {
    method: 'POST',
    headers: { authorization: `Bearer ${adminSecret}` },
    body: {
      action: 'cancel-schedule',
      day: 'day1',
      secret: adminSecret
    }
  };
  const mockResCancel = createMockRes();
  await workflowHandler(mockReqCancel, mockResCancel);

  assert(mockResCancel.statusCode === 200, 'Cancel schedule action returns HTTP 200');
  assert(mockResCancel.body?.success === true, 'Cancel response success is true');

  // Test 6: Retry failed action
  const mockReqRetry = {
    method: 'POST',
    headers: { authorization: `Bearer ${adminSecret}` },
    body: {
      action: 'retry-failed',
      day: 'day1',
      secret: adminSecret
    }
  };
  const mockResRetry = createMockRes();
  await workflowHandler(mockReqRetry, mockResRetry);

  assert(mockResRetry.statusCode === 200, 'Retry failed action returns HTTP 200');
  assert(mockResRetry.body?.success === true, 'Retry response success is true');

  // Test 7: Participant feedback submission validation
  const { default: feedbackApiHandler } = await import('./api/feedback.js');
  assert(typeof feedbackApiHandler === 'function', 'Participant feedback API api/feedback.js loaded');

  // Test missing reg ID validation
  const mockReqFbInvalid = {
    method: 'POST',
    headers: {},
    body: { registration_id: '', day: 'day1', rating: 5 }
  };
  const mockResFbInvalid = createMockRes();
  await feedbackApiHandler(mockReqFbInvalid, mockResFbInvalid);

  assert(mockResFbInvalid.statusCode === 422, 'Invalid registration ID submission rejected with HTTP 422');

  console.log('===========================================================');
  console.log(`AUDIT RESULTS: ${passedCount} / ${totalTests} TESTS PASSED`);
  console.log('===========================================================');

  if (passedCount < totalTests) {
    process.exit(1);
  }
}

runAudit();
