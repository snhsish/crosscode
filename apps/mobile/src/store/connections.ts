import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

let nextId = 1;
function uid() {
  return `${Date.now()}-${nextId++}`;
}

export type Connection = {
  id: string
  url: string
  name: string
  addedAt: number
}

type ConnectionsStore = {
  connections: Connection[]
  activeId: string | null
  addConnection: (conn: Omit<Connection, 'id' | 'addedAt'>) => void
  removeConnection: (id: string) => void
  setActive: (id: string) => void
}

export const useConnections = create<ConnectionsStore>()(
  persist(
    (set) => ({
      connections: [],
      activeId: null,
      addConnection: (conn) =>
        set((state) => ({
          connections: [
            ...state.connections,
            { ...conn, id: uid(), addedAt: Date.now() },
          ],
        })),
      removeConnection: (id) =>
        set((state) => ({
          connections: state.connections.filter((c) => c.id !== id),
          activeId: state.activeId === id ? null : state.activeId,
        })),
      setActive: (id) => set({ activeId: id }),
    }),
    {
      name: 'crosscode-connections',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

