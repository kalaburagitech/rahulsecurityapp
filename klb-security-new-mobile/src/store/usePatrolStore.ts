import { create } from 'zustand';

interface PatrolSession {
    id: string;
    siteId: string;
    siteName: string;
    startTime: number;
    scannedPointIds?: string[];
}

interface PatrolState {
    activeSession: PatrolSession | null;
    currentSite: any | null;
    offlineQueue: any[];

    setSession: (session: PatrolSession | null) => void;
    setCurrentSite: (site: any) => void;
    addToOfflineQueue: (log: any) => void;
    clearOfflineQueue: () => void;
}

export const usePatrolStore = create<PatrolState>((set) => ({
    activeSession: null,
    currentSite: null,
    offlineQueue: [],

    setSession: (activeSession) => set({ activeSession }),
    setCurrentSite: (currentSite) => set({ currentSite }),
    addToOfflineQueue: (log) => set((state) => ({
        offlineQueue: [...state.offlineQueue, log]
    })),
    clearOfflineQueue: () => set({ offlineQueue: [] }),
}));
