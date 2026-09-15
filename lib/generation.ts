import { Flower, FlowerId, ChunkCoords } from '../types';

const CHUNK_SIZE = 50;
const FLOWERS_PER_CHUNK = 100;
const SEED_MULTIPLIER = 73856093;
const SEED_MULTIPLIER_2 = 19349663;
const SEED_MULTIPLIER_3 = 83492791;

/**
 * Hash function for procedural generation
 */
function hash(x: number, y: number, z: number): number {
  let h = (x * SEED_MULTIPLIER) ^ (y * SEED_MULTIPLIER_2) ^ (z * SEED_MULTIPLIER_3);
  h = h ^ (h >> 16);
  h = ((h >>> 0) * 2654435761) >>> 0;
  return h;
}

/**
 * Pseudo-random number generator
 */
function pseudoRandom(seed: number, min: number, max: number): number {
  const random = ((seed >>> 0) * 2654435761) >>> 0;
  return min + ((random >>> 0) % ((max - min) * 1000)) / 1000;
}

/**
 * Get chunk coordinates from world position
 */
export function getChunkCoords(x: number, z: number): ChunkCoords {
  return {
    x: Math.floor(x / CHUNK_SIZE),
    z: Math.floor(z / CHUNK_SIZE),
  };
}

/**
 * Generate flower ID from chunk and index
 */
export function generateFlowerId(chunkX: number, chunkZ: number, index: number): FlowerId {
  return `${chunkX}-${chunkZ}-${index}`;
}

/**
 * Parse flower ID to get chunk and index
 */
export function parseFlowerId(flowerId: FlowerId): {
  chunkX: number;
  chunkZ: number;
  index: number;
} {
  const [chunkX, chunkZ, index] = flowerId.split('-').map(Number);
  return { chunkX, chunkZ, index };
}

/**
 * Generate flowers for a chunk procedurally
 */
export function generateChunkFlowers(chunkX: number, chunkZ: number): Flower[] {
  const flowers: Flower[] = [];
  const baseHash = hash(chunkX, 0, chunkZ);

  for (let i = 0; i < FLOWERS_PER_CHUNK; i++) {
    const seed = baseHash + i * 31;
    // Keep the original twenty flowers (and their saved-note locations) intact.
    // Additional flowers use a jittered grid to avoid the old generator's diagonal bands.
    const jitter = (n: number) => { const v = Math.sin(n * 127.1 + chunkX * 311.7 + chunkZ * 74.7) * 43758.5453; return v - Math.floor(v); };
    const localX = i < 20 ? pseudoRandom(seed, 0, CHUNK_SIZE) : (((i - 20) % 10) + 0.15 + jitter(i) * 0.7) * 5;
    const localZ = i < 20 ? pseudoRandom(seed + 1, 0, CHUNK_SIZE) : (Math.floor((i - 20) / 10) + 0.15 + jitter(i + 101) * 0.7) * 6.25;
    const worldX = chunkX * CHUNK_SIZE + localX;
    const worldZ = chunkZ * CHUNK_SIZE + localZ;

    const scale = pseudoRandom(seed + 2, 0.8, 1.5);
    const rotation = pseudoRandom(seed + 3, 0, Math.PI * 2);

    const flowerId = generateFlowerId(chunkX, chunkZ, i);

    flowers.push({
      id: flowerId,
      position: [worldX, 0, worldZ],
      scale,
      rotation,
      occupied: false,
    });
  }

  return flowers;
}

/**
 * Generate nearby flowers when a note is created
 * Creates 1-3 flowers in the vicinity
 */
export function generateNearbyFlowers(
  mainFlower: Flower
): Flower[] {
  const flowers: Flower[] = [];
  const [mainX, , mainZ] = mainFlower.position;
  const numNewFlowers = Math.floor(Math.random() * 3) + 1; // 1-3

  for (let i = 0; i < numNewFlowers; i++) {
    const distance = Math.random() * 15 + 5; // 5-20 units away
    const angle = Math.random() * Math.PI * 2;
    const offsetX = Math.cos(angle) * distance;
    const offsetZ = Math.sin(angle) * distance;

    const newX = mainX + offsetX;
    const newZ = mainZ + offsetZ;

    const { x: chunkX, z: chunkZ } = getChunkCoords(newX, newZ);
    const localX = newX - chunkX * CHUNK_SIZE;
    const localZ = newZ - chunkZ * CHUNK_SIZE;

    // Find next available index for this chunk
    const index = Math.floor(Math.random() * 1000);

    const scale = Math.random() * 0.7 + 0.6;
    const rotation = Math.random() * Math.PI * 2;

    const flowerId = generateFlowerId(chunkX, chunkZ, index);

    flowers.push({
      id: flowerId,
      position: [newX, 0, newZ],
      scale,
      rotation,
      occupied: false,
    });
  }

  return flowers;
}

/**
 * Get all chunks visible from camera position with render distance
 */
export function getVisibleChunks(
  cameraX: number,
  cameraZ: number,
  renderDistance: number = 3
): ChunkCoords[] {
  const chunks: ChunkCoords[] = [];
  const centerChunk = getChunkCoords(cameraX, cameraZ);

  for (let x = centerChunk.x - renderDistance; x <= centerChunk.x + renderDistance; x++) {
    for (let z = centerChunk.z - renderDistance; z <= centerChunk.z + renderDistance; z++) {
      chunks.push({ x, z });
    }
  }

  return chunks;
}

/**
 * Calculate distance between two flowers
 */
export function getDistance(flower1: Flower, flower2: Flower): number {
  const dx = flower1.position[0] - flower2.position[0];
  const dz = flower1.position[2] - flower2.position[2];
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Find closest flower to camera
 */
export function findClosestFlower(
  flowers: Flower[],
  cameraPos: [number, number, number],
  maxDistance: number = 30
): Flower | null {
  let closest: Flower | null = null;
  let minDistance = maxDistance;

  for (const flower of flowers) {
    const dx = flower.position[0] - cameraPos[0];
    const dz = flower.position[2] - cameraPos[2];
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < minDistance) {
      minDistance = distance;
      closest = flower;
    }
  }

  return closest;
}
