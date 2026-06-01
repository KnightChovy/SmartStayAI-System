const items = [
  'Calendar',
  'Tasks',
  'Messages',
  'File Manager',
  'Notes',
  'Support',
];

export function AdminDashboardAppPanel() {
  return (
    <div className="space-y-2">
      <h3 className="text-xl font-semibold">App</h3>
      {items.map(item => (
        <div
          key={item}
          className="rounded-sm bg-surface-container-low px-3 py-2.5 text-sm font-semibold"
        >
          {item}
        </div>
      ))}
    </div>
  );
}
