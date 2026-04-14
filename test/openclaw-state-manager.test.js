const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

test('OpenClawStateManager persists session state across instances', { concurrency: false }, () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ola-home-'));
  const previousHome = process.env.HOME;

  try {
    process.env.HOME = tmpHome;
    delete require.cache[require.resolve('../src/config')];
    delete require.cache[require.resolve('../src/openclaw/state-manager')];

    const OpenClawStateManager = require('../src/openclaw/state-manager');

    const firstManager = new OpenClawStateManager();
    firstManager.createState('session-1', { currentIndex: 2 });

    const secondManager = new OpenClawStateManager();
    const restoredState = secondManager.getState('session-1');

    assert.equal(restoredState.data.currentIndex, 2);

    secondManager.deleteState('session-1');
  } finally {
    process.env.HOME = previousHome;
    delete require.cache[require.resolve('../src/config')];
    delete require.cache[require.resolve('../src/openclaw/state-manager')];
  }
});
