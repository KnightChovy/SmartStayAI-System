/**
 * Kiểu props tối giản cho custom Tooltip của recharts v3 (recharts inject `active`/`payload`/`label`
 * lúc runtime). Dùng type riêng thay cho `TooltipProps` vì v3 đã đổi shape của content prop.
 */
export interface ChartTooltipItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

export interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: ChartTooltipItem[];
}
