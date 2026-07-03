import type { AdminTableProps } from '@/types/admin.types';

export function AdminTable({
  headers,
  rows,
  renderLastColumn,
}: AdminTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white lg:rounded-3xl">
      <table className="min-w-190 w-full text-left">
        <thead className="border-b bg-surface-container-low text-xs uppercase tracking-wide sm:text-sm">
          <tr>
            {headers.map(header => (
              <th key={header} className="px-3 py-3 sm:px-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={`${row[0]}-${rowIdx}`} className="border-b last:border-b-0">
              {row.map((cell, idx) => {
                const isLast = idx === row.length - 1;
                if (isLast && renderLastColumn) {
                  return (
                    <td key={`${row[0]}-${rowIdx}-${idx}`} className="px-3 py-3 sm:px-4">
                      {renderLastColumn(row)}
                    </td>
                  );
                }
                return (
                  <td
                    key={`${row[0]}-${rowIdx}-${idx}`}
                    className="px-3 py-3 text-sm sm:px-4 sm:text-base"
                  >
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
