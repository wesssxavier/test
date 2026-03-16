import { create } from 'zustand';

interface EventState {
  currentEventId: string | null;
  currentEventName: string | null;
  setCurrentEvent: (id: string | null, name?: string | null) => void;
}

export const useEventStore = create<EventState>((set) => ({
  currentEventId: null,
  currentEventName: null,
  setCurrentEvent: (id, name = null) => set({ currentEventId: id, currentEventName: name }),
}));
