export type FlowerId = string; // Format: "chunkX-chunkZ-index"

export interface Flower {
  id: FlowerId;
  position: [number, number, number];
  scale: number;
  rotation: number;
  note?: string;
  occupied: boolean;
}

export interface ChunkCoords {
  x: number;
  z: number;
}

export interface ApiChunkResponse {
  flowers: Array<{
    flower_id: FlowerId;
    note: string;
  }>;
}

export interface ApiNoteRequest {
  flower_id: FlowerId;
  note: string;
}

export interface ApiNoteResponse {
  success: boolean;
  flower_id: FlowerId;
  message?: string;
}

export interface StoredNote {
  id: string;
  flower_id: FlowerId;
  note: string;
  created_at: number;
}
