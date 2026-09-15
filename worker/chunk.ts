import { Router } from 'itty-router';

interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

const router = Router();

/**
 * GET /api/chunk?x=<chunkX>&z=<chunkZ>
 * Returns all occupied flowers in a chunk
 */
router.get('/api/chunk', async (request, env: Env) => {
  try {
    const url = new URL(request.url);
    const x = url.searchParams.get('x');
    const z = url.searchParams.get('z');

    if (!x || !z) {
      return new Response(
        JSON.stringify({ error: 'Missing chunk coordinates' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const chunkX = parseInt(x, 10);
    const chunkZ = parseInt(z, 10);

    // Query flowers in this chunk
    // Flower IDs are formatted as "chunkX-chunkZ-index"
    const pattern = `${chunkX}-${chunkZ}-%`;

    const result = await env.DB.prepare(
      `SELECT flower_id, note FROM notes WHERE flower_id LIKE ? ORDER BY created_at DESC`
    )
      .bind(pattern)
      .all();

    const flowers = result.results.map((row: any) => ({
      flower_id: row.flower_id,
      note: row.note,
    }));

    return new Response(
      JSON.stringify({ flowers }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching chunk:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', flowers: [] }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

export default router;
