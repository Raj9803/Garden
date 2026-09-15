export type ChunkCoords = {
  x: number;
  z: number;
};

export type Flower = {
  flower_id: string;
  note?: string;
};

export type ApiChunkResponse = {
  flowers: Flower[];
};

export type Note = {
  id?: string;
  flowerId?: string;
  flower_id?: string;
  note: string;
};

export type ApiResponse = {
  success: boolean;
  message?: string;
  flower_id?: string;
};

const API =
  process.env.NEXT_PUBLIC_API_URL ??
  "http://127.0.0.1:8787";

// Cache for chunk requests (avoid duplicate simultaneous requests)
const chunkRequestCache = new Map<string, Promise<ApiChunkResponse>>();

/**
 * CHUNK FETCH with deduplication
 */
export async function fetchChunkFlowers(
  chunk: ChunkCoords
): Promise<ApiChunkResponse> {
  const cacheKey = `${chunk.x}-${chunk.z}`;
  
  // Return cached promise if request in flight
  if (chunkRequestCache.has(cacheKey)) {
    return chunkRequestCache.get(cacheKey)!;
  }
  
  // Create new request promise
  const promise = (async () => {
    try {
      const response = await fetch(
        `${API}/chunk?x=${chunk.x}&z=${chunk.z}`
      );

      if (!response.ok) {
        return { flowers: [] };
      }

      const data = (await response.json()) as ApiChunkResponse;
      return data;
    } finally {
      // Clean up cache after request completes
      chunkRequestCache.delete(cacheKey);
    }
  })();
  
  chunkRequestCache.set(cacheKey, promise);
  return promise;
}

/**
 * CREATE / UPDATE NOTE
 */
export async function createNote(note: Note): Promise<ApiResponse> {
  const response = await fetch(`${API}/note`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(note),
  });

  const data = (await response.json()) as ApiResponse;

  return data;
}

/**
 * NEW WRAPPER (frontend friendly)
 */
export async function saveNote(
  flowerId: string,
  note: string
): Promise<ApiResponse> {
  return createNote({
    flower_id: flowerId,
    note,
  });
}

/**
 * FETCH NOTE
 */
export async function fetchNote(
  flowerId: string
): Promise<Note | null> {
  const response = await fetch(
    `${API}/note?flower_id=${flowerId}`
  );

  if (!response.ok) return null;

  const data = (await response.json()) as Note;

  return data;
}