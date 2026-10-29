/** Compare displayed Vietnamese dates chronologically, with numeric-aware text fallback. */
export function compareValues(a: string | number, b: string | number) {
  const sortable = (value: string | number): string | number => {
    if (typeof value === 'number') return value;
    const date = /^(\d{2})\/(\d{2})\/(\d{4})(?: (\d{2}):(\d{2}))?$/.exec(value);
    if (date) return Date.UTC(+date[3], +date[2] - 1, +date[1], +(date[4] || 0), +(date[5] || 0));
    const elapsed = /^(\d+) giờ (\d+) phút$/.exec(value);
    if (elapsed) return +elapsed[1] * 60 + +elapsed[2];
    return value;
  };
  const left = sortable(a),
    right = sortable(b);
  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'vi', { numeric: true });
}
