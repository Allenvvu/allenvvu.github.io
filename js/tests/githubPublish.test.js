import { assert } from './run.js';
import { publishLayout } from '../githubPublish.js';

export async function runTests() {
  // success: GET returns SHA, PUT succeeds
  {
    const orig = window.fetch;
    let call = 0;
    window.fetch = async () => {
      call++;
      if (call === 1) return { ok: true, json: async () => ({ sha: 'abc123' }) };
      return { ok: true, json: async () => ({}) };
    };
    const r = await publishLayout({ version: 1 }, 'tok');
    assert(r.ok === true, 'publishLayout: ok:true on success');
    window.fetch = orig;
  }

  // failure: GET returns 401
  {
    const orig = window.fetch;
    window.fetch = async () => ({ ok: false, status: 401, json: async () => ({ message: 'Bad credentials' }) });
    const r = await publishLayout({ version: 1 }, 'bad');
    assert(r.ok === false, 'publishLayout: ok:false when GET fails');
    assert(typeof r.error === 'string', 'publishLayout: error is string when GET fails');
    window.fetch = orig;
  }

  // failure: network error on GET
  {
    const orig = window.fetch;
    window.fetch = async () => { throw new Error('NetworkError'); };
    const r = await publishLayout({ version: 1 }, 'tok');
    assert(r.ok === false, 'publishLayout: ok:false on network error');
    assert(r.error.includes('NetworkError'), 'publishLayout: error includes thrown message');
    window.fetch = orig;
  }

  // failure: PUT returns 422
  {
    const orig = window.fetch;
    let call = 0;
    window.fetch = async () => {
      call++;
      if (call === 1) return { ok: true, json: async () => ({ sha: 'abc123' }) };
      return { ok: false, status: 422, json: async () => ({ message: 'Validation Failed' }) };
    };
    const r = await publishLayout({ version: 1 }, 'tok');
    assert(r.ok === false, 'publishLayout: ok:false when PUT fails');
    assert(r.error === 'Validation Failed', 'publishLayout: error from PUT response message');
    window.fetch = orig;
  }

  // failure: network error on PUT
  {
    const orig = window.fetch;
    let call = 0;
    window.fetch = async () => {
      call++;
      if (call === 1) return { ok: true, json: async () => ({ sha: 'abc123' }) };
      throw new Error('NetworkError');
    };
    const r = await publishLayout({ version: 1 }, 'tok');
    assert(r.ok === false, 'publishLayout: ok:false on PUT network error');
    assert(r.error.includes('NetworkError'), 'publishLayout: error includes message on PUT network error');
    window.fetch = orig;
  }
}
