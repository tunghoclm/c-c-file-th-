import { describe, expect, it } from 'vitest';
import { compareValues } from './sort';
describe('Sắp xếp bảng', () => {
  it('xếp ngày theo thời gian, bao gồm các tháng và năm khác nhau', () => {
    expect(
      ['02/10/2026 09:00', '30/09/2026 10:00', '01/01/2025 01:00'].sort(compareValues),
    ).toEqual(['01/01/2025 01:00', '30/09/2026 10:00', '02/10/2026 09:00']);
  });
  it('xếp thời lượng và số tiền theo số', () => {
    expect(compareValues('10 giờ 0 phút', '9 giờ 59 phút')).toBeGreaterThan(0);
    expect([100000, 5000, 20000].sort(compareValues)).toEqual([5000, 20000, 100000]);
  });
});
