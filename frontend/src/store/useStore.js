import create from 'zustand';

type State = {
  liked: any[];
  addLiked: (item: any) => void;
};

export const useStore = create<State>((set) => ({
  liked: [],
  addLiked: (item) => set((s) => ({ liked: [...s.liked, item] }))
}));
