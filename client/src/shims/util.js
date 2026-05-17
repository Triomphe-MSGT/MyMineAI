export function debuglog() {
  return () => {};
}

export function inspect(value) {
  try {
    return typeof value === 'string' ? value : JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default { debuglog, inspect };

