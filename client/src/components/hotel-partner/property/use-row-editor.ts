import { useRef, useState } from 'react';

/** Prefix của id do client sinh cho dòng chưa lưu (id thật của BE là uuid). */
const NEW_PREFIX = 'new-';

export interface RowWithId {
  /** Key ổn định: id thật của bản ghi đã lưu, hoặc `new-N` cho dòng vừa thêm. */
  id: string;
}

/**
 * State cho các editor replace-all dạng danh sách (contacts / policies / nearby places).
 *
 * Dòng đã lưu mặc định **thu gọn**; chỉ dòng vừa Add hoặc đang Edit mới mở form.
 * Dùng `id` thay cho index để xoá dòng giữa chừng không làm trạng thái mở/đóng
 * nhảy sang dòng khác.
 *
 * @param seed  Dòng suy ra từ response GET; chỉ dùng cho tới khi người dùng sửa lần đầu.
 * @param makeEmpty  Tạo dòng rỗng với id do hook cấp.
 */
export function useRowEditor<T extends RowWithId>(seed: T[], makeEmpty: (id: string) => T) {
  const [rows, setRows] = useState<T[] | null>(null);
  const [editingIds, setEditingIds] = useState<string[]>([]);
  const nextId = useRef(0);

  const current = rows ?? seed;

  const add = () => {
    const id = `${NEW_PREFIX}${nextId.current++}`;
    setRows([...current, makeEmpty(id)]);
    setEditingIds([...editingIds, id]);
  };

  const update = (id: string, patch: Partial<T>) =>
    setRows(current.map(r => (r.id === id ? { ...r, ...patch } : r)));

  const remove = (id: string) => {
    setRows(current.filter(r => r.id !== id));
    setEditingIds(editingIds.filter(x => x !== id));
  };

  return {
    rows: current,
    add,
    update,
    remove,
    /** Dòng chưa từng được lưu lên BE. */
    isNew: (id: string) => id.startsWith(NEW_PREFIX),
    isEditing: (id: string) => editingIds.includes(id),
    startEdit: (id: string) => setEditingIds([...editingIds, id]),
    stopEdit: (id: string) => setEditingIds(editingIds.filter(x => x !== id)),
  };
}
