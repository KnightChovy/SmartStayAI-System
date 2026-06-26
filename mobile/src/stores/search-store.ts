import { create } from 'zustand';
interface SearchState {
  history: string[];
  add: (city: string) => void;
  clear: () => void;
}
export const useSearchStore = create<SearchState>(set => ({
  history: [],
  add: city =>
    set(s => ({
      history: [
        city,
        ...s.history.filter(v => v.toLowerCase() !== city.toLowerCase()),
      ].slice(0, 5),
    })),
  clear: () => set({ history: [] }),
}));
