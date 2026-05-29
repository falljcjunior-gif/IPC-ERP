/**
 * Unit tests — Provisioning Saga runner
 *
 * Tests the saga algorithm in isolation:
 *   - Steps execute in order
 *   - On step failure, completed steps are compensated in reverse
 *   - Already-done steps are skipped on resume (idempotency)
 *   - runSaga resolves with step results on success
 *   - runSaga rejects with the failing step's error
 *   - Compensation failures are logged but don't stop other compensations
 *
 * This file replicates the runSaga function inline (same pattern as
 * rate_limiter.test.js) so it's testable without importing the CF module
 * (which requires firebase-admin at module load time).
 */

import { vi, describe, it, test, expect, beforeEach } from 'vitest';

// ── Inline replica of runSaga (must stay in sync with provisioningJobs.js) ───

const STEP_STATUS = Object.freeze({
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  DONE:    'DONE',
  FAILED:  'FAILED',
  SKIPPED: 'SKIPPED',
});

const JOB_STATUS = Object.freeze({
  PENDING:      'PENDING',
  IN_PROGRESS:  'IN_PROGRESS',
  DONE:         'DONE',
  FAILED:       'FAILED',
  COMPENSATING: 'COMPENSATING',
  COMPENSATED:  'COMPENSATED',
});

/**
 * Minimal in-memory "job document" that tracks state the same way Firestore would.
 * `update()` applies shallow dot-path updates.
 */
function makeJobDoc() {
  const data = { status: JOB_STATUS.IN_PROGRESS, steps: {}, compensations: {}, error: null };

  function applyDotPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] === undefined) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  const ref = {
    async update(patch) {
      for (const [key, value] of Object.entries(patch)) {
        if (key === 'updatedAt') continue;   // skip timestamps in tests
        if (key.includes('.')) {
          applyDotPath(data, key, value);
        } else {
          data[key] = value;
        }
      }
    },
    get data() { return data; },
  };

  return ref;
}

async function runSaga(jobRef, steps, existingSteps = {}) {
  const completed = [];
  const results   = {};

  async function track(update) {
    try { await jobRef.update(update); } catch { /* best-effort */ }
  }

  for (const step of steps) {
    const prior = existingSteps[step.name];
    if (prior?.status === STEP_STATUS.DONE) {
      results[step.name] = prior.result ?? null;
      completed.push({ step, result: prior.result ?? null });
      continue;
    }

    await track({ [`steps.${step.name}.status`]: STEP_STATUS.RUNNING });

    try {
      const result = await step.run();
      results[step.name] = result;
      completed.push({ step, result });
      await track({
        [`steps.${step.name}.status`]:      STEP_STATUS.DONE,
        [`steps.${step.name}.result`]:      result ?? null,
        [`steps.${step.name}.completedAt`]: 'ts',
      });
    } catch (err) {
      await track({
        [`steps.${step.name}.status`]: STEP_STATUS.FAILED,
        [`steps.${step.name}.error`]:  err.message,
        status: JOB_STATUS.COMPENSATING,
        error:  err.message,
      });

      for (const { step: cs, result: sr } of [...completed].reverse()) {
        if (typeof cs.compensate !== 'function') continue;
        try {
          await cs.compensate(sr, results);
          await track({ [`compensations.${cs.name}.status`]: 'DONE' });
        } catch (compErr) {
          await track({ [`compensations.${cs.name}.status`]: 'FAILED' });
        }
      }

      await track({ status: JOB_STATUS.COMPENSATED });
      throw err;
    }
  }
  return results;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('runSaga — happy path', () => {
  it('runs all steps in order and returns results', async () => {
    const log = [];
    const jobRef = makeJobDoc();

    const steps = [
      { name: 'A', async run() { log.push('A'); return { a: 1 }; } },
      { name: 'B', async run() { log.push('B'); return { b: 2 }; } },
      { name: 'C', async run() { log.push('C'); return { c: 3 }; } },
    ];

    const results = await runSaga(jobRef, steps);

    expect(log).toEqual(['A', 'B', 'C']);
    expect(results).toEqual({ A: { a: 1 }, B: { b: 2 }, C: { c: 3 } });
  });

  it('marks each step as DONE in the job doc', async () => {
    const jobRef = makeJobDoc();
    const steps = [
      { name: 'S1', async run() { return 'ok1'; } },
      { name: 'S2', async run() { return 'ok2'; } },
    ];

    await runSaga(jobRef, steps);

    expect(jobRef.data.steps.S1.status).toBe(STEP_STATUS.DONE);
    expect(jobRef.data.steps.S2.status).toBe(STEP_STATUS.DONE);
    expect(jobRef.data.steps.S1.result).toBe('ok1');
    expect(jobRef.data.steps.S2.result).toBe('ok2');
  });
});

describe('runSaga — compensation on failure', () => {
  it('compensates completed steps in reverse when a step fails', async () => {
    const compensated = [];
    const jobRef = makeJobDoc();

    const steps = [
      {
        name: 'step1',
        async run() { return 'r1'; },
        async compensate(r) { compensated.push(`comp:step1:${r}`); },
      },
      {
        name: 'step2',
        async run() { return 'r2'; },
        async compensate(r) { compensated.push(`comp:step2:${r}`); },
      },
      {
        name: 'step3',
        async run() { throw new Error('step3 exploded'); },
        async compensate() { compensated.push('comp:step3'); },
      },
    ];

    await expect(runSaga(jobRef, steps)).rejects.toThrow('step3 exploded');

    // compensation runs for step2 and step1 in reverse (step3 never completed)
    expect(compensated).toEqual(['comp:step2:r2', 'comp:step1:r1']);
  });

  it('marks the failing step as FAILED and job as COMPENSATED', async () => {
    const jobRef = makeJobDoc();

    await expect(
      runSaga(jobRef, [
        { name: 's1', async run() { return 1; } },
        { name: 's2', async run() { throw new Error('boom'); } },
      ])
    ).rejects.toThrow('boom');

    expect(jobRef.data.steps.s1.status).toBe(STEP_STATUS.DONE);
    expect(jobRef.data.steps.s2.status).toBe(STEP_STATUS.FAILED);
    expect(jobRef.data.steps.s2.error).toBe('boom');
    expect(jobRef.data.status).toBe(JOB_STATUS.COMPENSATED);
    expect(jobRef.data.error).toBe('boom');
  });

  it('continues compensating even if one compensation throws', async () => {
    const compensated = [];
    const jobRef = makeJobDoc();

    const steps = [
      {
        name: 's1',
        async run() { return 1; },
        async compensate() { compensated.push('s1'); },
      },
      {
        name: 's2',
        async run() { return 2; },
        async compensate() {
          compensated.push('s2-attempt');
          throw new Error('compensation failure in s2');
        },
      },
      {
        name: 's3',
        async run() { throw new Error('s3 failed'); },
      },
    ];

    await expect(runSaga(jobRef, steps)).rejects.toThrow('s3 failed');

    // s2 compensation threw, but s1 compensation still ran
    expect(compensated).toContain('s2-attempt');
    expect(compensated).toContain('s1');
    expect(compensated.indexOf('s2-attempt')).toBeLessThan(compensated.indexOf('s1'));

    // s2 compensation is marked FAILED, s1 is DONE
    expect(jobRef.data.compensations.s2.status).toBe('FAILED');
    expect(jobRef.data.compensations.s1.status).toBe('DONE');
  });

  it('skips compensation for steps without a compensate function', async () => {
    const log = [];
    const jobRef = makeJobDoc();

    const steps = [
      { name: 's1', async run() { return 1; } /* no compensate */ },
      { name: 's2', async run() { return 2; }, async compensate() { log.push('s2'); } },
      { name: 's3', async run() { throw new Error('fail'); } },
    ];

    await expect(runSaga(jobRef, steps)).rejects.toThrow();

    // only s2 has a compensate, s1 doesn't
    expect(log).toEqual(['s2']);
  });
});

describe('runSaga — resume / idempotency', () => {
  it('skips steps already marked DONE in existingSteps', async () => {
    const log = [];
    const jobRef = makeJobDoc();

    const steps = [
      { name: 'A', async run() { log.push('A'); return 'a'; } },
      { name: 'B', async run() { log.push('B'); return 'b'; } },
      { name: 'C', async run() { log.push('C'); return 'c'; } },
    ];

    // Simulate A already completed on a previous attempt
    const existingSteps = {
      A: { status: STEP_STATUS.DONE, result: 'a-from-cache' },
    };

    const results = await runSaga(jobRef, steps, existingSteps);

    // A should be skipped, B and C should run
    expect(log).toEqual(['B', 'C']);
    // The cached result from A is returned
    expect(results.A).toBe('a-from-cache');
    expect(results.B).toBe('b');
    expect(results.C).toBe('c');
  });

  it('passes cached result to compensation if a later step fails', async () => {
    const compensated = [];
    const jobRef = makeJobDoc();

    const steps = [
      {
        name: 'A',
        async run() { return 'a-fresh'; },
        async compensate(r) { compensated.push(`comp-A:${r}`); },
      },
      {
        name: 'B',
        async run() { throw new Error('B failed'); },
      },
    ];

    const existingSteps = {
      A: { status: STEP_STATUS.DONE, result: 'a-from-cache' },
    };

    await expect(runSaga(jobRef, steps, existingSteps)).rejects.toThrow('B failed');

    // A's compensation receives its cached result
    expect(compensated).toEqual(['comp-A:a-from-cache']);
  });
});

describe('runSaga — edge cases', () => {
  test('empty steps array resolves immediately with empty results', async () => {
    const jobRef = makeJobDoc();
    const results = await runSaga(jobRef, []);
    expect(results).toEqual({});
  });

  test('single step that succeeds', async () => {
    const jobRef = makeJobDoc();
    const results = await runSaga(jobRef, [
      { name: 'only', async run() { return 42; } },
    ]);
    expect(results.only).toBe(42);
    expect(jobRef.data.steps.only.status).toBe(STEP_STATUS.DONE);
  });

  test('single step that fails — COMPENSATED with no compensations run', async () => {
    const jobRef = makeJobDoc();
    await expect(
      runSaga(jobRef, [{ name: 'only', async run() { throw new Error('fail'); } }])
    ).rejects.toThrow('fail');
    expect(jobRef.data.status).toBe(JOB_STATUS.COMPENSATED);
  });

  test('steps receive correct results in order through closure pattern', async () => {
    const resultsRef = {};
    const jobRef = makeJobDoc();

    const steps = [
      {
        name: 'create',
        async run() { return { id: 'ent_001' }; },
      },
      {
        name: 'activate',
        async run() {
          // simulate reading previous result via closure
          const prevId = resultsRef.create?.id;
          return { entityId: prevId, state: 'ACTIVE' };
        },
      },
    ];

    // Wrap steps to populate resultsRef (mirrors provisioningJobs.js pattern)
    for (const step of steps) {
      const orig = step.run.bind(step);
      step.run = async () => { const r = await orig(); resultsRef[step.name] = r; return r; };
    }

    const results = await runSaga(jobRef, steps);
    expect(results.create).toEqual({ id: 'ent_001' });
    expect(results.activate).toEqual({ entityId: 'ent_001', state: 'ACTIVE' });
  });
});

describe('JOB_STATUS and STEP_STATUS constants', () => {
  test('all expected status values are present', () => {
    expect(JOB_STATUS.PENDING).toBe('PENDING');
    expect(JOB_STATUS.IN_PROGRESS).toBe('IN_PROGRESS');
    expect(JOB_STATUS.DONE).toBe('DONE');
    expect(JOB_STATUS.FAILED).toBe('FAILED');
    expect(JOB_STATUS.COMPENSATING).toBe('COMPENSATING');
    expect(JOB_STATUS.COMPENSATED).toBe('COMPENSATED');

    expect(STEP_STATUS.PENDING).toBe('PENDING');
    expect(STEP_STATUS.RUNNING).toBe('RUNNING');
    expect(STEP_STATUS.DONE).toBe('DONE');
    expect(STEP_STATUS.FAILED).toBe('FAILED');
    expect(STEP_STATUS.SKIPPED).toBe('SKIPPED');
  });
});
