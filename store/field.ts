import { create } from 'zustand';
import { Flower, FlowerId, ChunkCoords } from '../types';
import { generateChunkFlowers, getChunkCoords } from '../lib/generation';
import { fetchChunkFlowers } from '../lib/api';

interface FieldStore {
  // Flowers
  flowers: Map<FlowerId, Flower>;
  loadedChunks: Set<string>;

  // UI State
  selectedFlower: Flower | null;
  isWriting: boolean;
  cameraPos: [number, number, number];

  // Actions
  addFlowers: (flowers: Flower[]) => void;
  setSelectedFlower: (flower: Flower | null) => void;
  setIsWriting: (writing: boolean) => void;
  setCameraPos: (pos: [number, number, number]) => void;
  updateFlowerNote: (flowerId: FlowerId, note: string) => void;
  loadChunk: (chunk: ChunkCoords) => Promise<void>;
  retainChunks: (chunks: ChunkCoords[]) => void;
  isChunkLoaded: (chunk: ChunkCoords) => boolean;
  getFlower: (flowerId: FlowerId) => Flower | undefined;
  getNearbyFlowers: (pos: [number, number, number], radius: number) => Flower[];
  clear: () => void;
}

let activeChunks = new Set<string>();
const requests = new Map<string, symbol>();
export const useFieldStore = create<FieldStore>((set, get) => ({
  flowers: new Map(),
  loadedChunks: new Set(),
  selectedFlower: null,
  isWriting: false,
  cameraPos: [0, 0, 0],

  addFlowers: (flowers) => {
    set((state) => {
      const newFlowers = new Map(state.flowers);
      for (const flower of flowers) {
        newFlowers.set(flower.id, flower);
      }
      return { flowers: newFlowers };
    });
  },

  setSelectedFlower: (flower) => {
    set({ selectedFlower: flower });
  },

  setIsWriting: (writing) => {
    set({ isWriting: writing });
  },

  setCameraPos: (pos) => {
    // Only update if position changed significantly (avoid unnecessary updates)
    const current = get().cameraPos;
    const dx = Math.abs(pos[0] - current[0]);
    const dy = Math.abs(pos[1] - current[1]);
    const dz = Math.abs(pos[2] - current[2]);
    
    if (dx > 0.1 || dy > 0.1 || dz > 0.1) {
      set({ cameraPos: pos });
    }
  },

  updateFlowerNote: (flowerId, note) => {
    set((state) => {
      const newFlowers = new Map(state.flowers);
      const flower = newFlowers.get(flowerId);
      if (flower) {
        newFlowers.set(flowerId, {
          ...flower,
          note,
          occupied: true,
        });
      }
      return { flowers: newFlowers };
    });
  },

  retainChunks: (chunks) => {
    activeChunks = new Set(chunks.map(c => `${c.x}-${c.z}`));
    for (const key of requests.keys()) if (!activeChunks.has(key)) requests.delete(key);
    set(state => ({
      flowers: new Map([...state.flowers].filter(([, flower]) => {
        const c = getChunkCoords(flower.position[0], flower.position[2]);
        return activeChunks.has(`${c.x}-${c.z}`);
      })),
      loadedChunks: new Set([...state.loadedChunks].filter(key => activeChunks.has(key))),
    }));
  },

  loadChunk: async (chunk) => {
    const chunkKey = `${chunk.x}-${chunk.z}`;
    if (get().isChunkLoaded(chunk) || requests.has(chunkKey)) {
      return;
    }

    // Generate procedural flowers
    const proceduralFlowers = generateChunkFlowers(chunk.x, chunk.z);
    const request = Symbol(chunkKey);
    requests.set(chunkKey, request);
    get().addFlowers(proceduralFlowers);

    // Fetch occupied flowers from API
    const { flowers: occupiedFlowers } = await fetchChunkFlowers(chunk).catch(() => ({ flowers: [] }));
    if (requests.get(chunkKey) !== request || !activeChunks.has(chunkKey)) return;
    requests.delete(chunkKey);

    // Mark occupied flowers
    const flowerMap = new Map<string, Flower>();
    for (const flower of proceduralFlowers) {
      flowerMap.set(flower.id, flower);
    }

    for (const occupied of occupiedFlowers) {
      const existing = flowerMap.get(occupied.flower_id);
      if (existing) {
        existing.note = occupied.note;
        existing.occupied = true;
      }
    }

    // Preserve any note saved while the initial request was still in flight.
    for (const [id, flower] of flowerMap) {
      const current = get().flowers.get(id);
      if (current?.occupied) flowerMap.set(id, current);
    }

    // Add to store
    get().addFlowers(Array.from(flowerMap.values()));

    // Mark chunk as loaded
    set((state) => {
      const newLoadedChunks = new Set(state.loadedChunks);
      newLoadedChunks.add(chunkKey);
      return { loadedChunks: newLoadedChunks };
    });
  },

  isChunkLoaded: (chunk) => {
    return get().loadedChunks.has(`${chunk.x}-${chunk.z}`);
  },

  getFlower: (flowerId) => {
    return get().flowers.get(flowerId);
  },

  getNearbyFlowers: (pos, radius) => {
    const flowers = Array.from(get().flowers.values());
    const radiusSq = radius * radius; // Avoid sqrt in loop
    return flowers.filter((flower) => {
      const dx = flower.position[0] - pos[0];
      const dz = flower.position[2] - pos[2];
      return dx * dx + dz * dz <= radiusSq; // Compare squared distances
    });
  },

  clear: () => {
    activeChunks.clear();
    requests.clear();
    set({
      flowers: new Map(),
      loadedChunks: new Set(),
      selectedFlower: null,
      isWriting: false,
    });
  },
}));
