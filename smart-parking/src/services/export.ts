import { toast } from 'sonner';
export async function exportExcel(name: string, rows: Record<string, string | number>[]) {
  const loading = toast.loading('Đang tạo tệp Excel...');
  try {
    const { Workbook } = await import('exceljs');
    const workbook = new Workbook();
    workbook.creator = 'Smart Parking';
    const sheet = workbook.addWorksheet('Dữ liệu');
    const headers = Object.keys(rows[0] || { 'Không có dữ liệu': '' });
    sheet.columns = headers.map((key) => ({
      header: key,
      key,
      width: Math.max(18, Math.min(40, key.length + 12)),
    }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF102C59' } };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, rows.length + 1), column: headers.length },
    };
    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(
      new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.xlsx`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Đã xuất ${rows.length} bản ghi`, { id: loading });
  } catch {
    toast.error('Không thể tạo tệp Excel. Hãy thử lại.', { id: loading });
  }
}
