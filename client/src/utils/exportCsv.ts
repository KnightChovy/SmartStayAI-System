export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

export interface CsvExportOptions {
  /**
   * Khối ngữ cảnh đặt TRƯỚC bảng (kỳ báo cáo, thời điểm xuất, đơn vị tiền…).
   * Không có thì file rời khỏi màn hình là mất sạch bối cảnh — người nhận không biết
   * số này của kỳ nào.
   */
  meta?: [label: string, value: string | number][];
  /** Dòng tổng đặt SAU bảng; số ô phải khớp số cột. */
  totalRow?: (string | number | null | undefined)[];
}

/** Ô tiền cho CSV: làm tròn về số nguyên VND, để trống khi không có giá trị. */
export function csvMoney(
  value: string | number | null | undefined
): number | '' {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(n)) return '';
  // VND không dùng phần lẻ ⇒ làm tròn để ô luôn là số nguyên, parse đúng ở mọi locale.
  return Math.round(n);
}

/**
 * Ô phần trăm: xuất kèm dấu `%` để Excel coi là CHỮ.
 * Cố ý không xuất số thực (`12.8`): dấu chấm ở locale VN bị hiểu là phân cách nghìn nên
 * `12.8` có thể thành `128`. Cột tỉ lệ vốn không ai cộng, đọc đúng quan trọng hơn.
 */
export function csvPercent(
  value: number | null | undefined,
  fractionDigits = 2
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return '—';
  return `${value.toFixed(fractionDigits)}%`;
}

type Cell = string | number | null | undefined;

const escapeCell = (v: Cell): string => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toLine = (cells: Cell[]): string => cells.map(escapeCell).join(',');

/** Ghi chuỗi CSV đã dựng sẵn ra file tải về (BOM + tên file có đuôi .csv). */
function download(filename: string, lines: string[]): void {
  const blob = new Blob(['﻿' + lines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface CsvSection {
  /** Tiêu đề khối — để người đọc biết đang nhìn bảng nào giữa nhiều bảng. */
  title?: string;
  /** Hàng tiêu đề cột. Bỏ trống khi khối là danh sách cặp nhãn–giá trị. */
  headers?: string[];
  rows: Cell[][];
  /** Dòng ghi chú dưới khối — vd nói rõ dữ liệu bị cắt bớt. */
  note?: string;
}

/**
 * Báo cáo NHIỀU KHỐI trong một file: tóm tắt + chuỗi thời gian + bảng chi tiết.
 *
 * CSV chỉ diễn tả được một bảng, nên nhiều khối được ngăn bằng dòng trắng + tiêu đề khối —
 * cách các bản xuất báo cáo vẫn làm, và Excel hiển thị bình thường. Dùng khi người dùng cần
 * **toàn bộ những gì đang thấy trên màn hình**, không phải mỗi bảng một file rời.
 */
export function exportCsvReport(
  filename: string,
  sections: CsvSection[],
  meta: [label: string, value: Cell][] = []
): void {
  const lines: string[] = ['sep=,'];

  for (const [label, value] of meta) lines.push(toLine([label, value]));

  for (const section of sections) {
    if (lines.length > 1) lines.push('');
    if (section.title) lines.push(toLine([section.title]));
    if (section.headers) lines.push(toLine(section.headers));
    for (const row of section.rows) lines.push(toLine(row));
    if (section.note) lines.push(toLine([section.note]));
  }

  download(filename, lines);
}

export function exportToCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  rows: T[],
  options: CsvExportOptions = {}
): void {
  const line = toLine;

  const lines: string[] = ['sep=,'];

  if (options.meta?.length) {
    for (const [label, value] of options.meta) lines.push(line([label, value]));
    lines.push(''); // dòng trắng ngăn khối ngữ cảnh với bảng
  }

  lines.push(line(columns.map(c => c.header)));
  for (const row of rows) lines.push(line(columns.map(c => c.value(row))));

  if (options.totalRow?.length) {
    lines.push('');
    lines.push(line(options.totalRow));
  }

  download(filename, lines);
}
