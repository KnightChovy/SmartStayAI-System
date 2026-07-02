/**
 * Xuất dữ liệu dạng bảng ra file CSV (client-side, không cần thư viện).
 * Escape đúng RFC 4180 (bọc `"` khi có dấu phẩy/xuống dòng/nháy kép) và thêm BOM
 * để Excel mở tiếng Việt không lỗi font.
 */
export function exportToCsv<T>(
  filename: string,
  columns: { header: string; value: (row: T) => string | number | null | undefined }[],
  rows: T[]
): void {
  const escape = (v: string | number | null | undefined): string => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const headerLine = columns.map(c => escape(c.header)).join(',');
  const bodyLines = rows.map(row =>
    columns.map(c => escape(c.value(row))).join(',')
  );
  const csv = [headerLine, ...bodyLines].join('\r\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
