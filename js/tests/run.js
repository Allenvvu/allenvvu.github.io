const results = [];

export function assert(condition, msg) {
  results.push({ pass: !!condition, msg });
}

export function assertEqual(a, b, msg) {
  const pass = JSON.stringify(a) === JSON.stringify(b);
  results.push({ pass, msg: pass ? msg : `${msg} — got ${JSON.stringify(a)}, expected ${JSON.stringify(b)}` });
}

export function getResults() {
  return results;
}
