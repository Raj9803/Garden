/// <reference types="@cloudflare/workers-types" />
const router = Router();
import { Router } from 'itty-router';
// Add this after router is created

router.get('/', () => {
  return Response.redirect('https://sunflower.anonymousguy074.workers.dev/', 302);
});

interface Env {
  DB: D1Database;
  ENVIRONMENT: string;
}

interface RequestWithEnv extends Request {
  __KFCFB__?: any;
}



/**
 * CORS headers helper
 */
function addCorsHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * OPTIONS handler for CORS preflight
 */
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
});

/**
 * GET /api/chunk?x=<chunkX>&z=<chunkZ>
 */
router.get('/api/chunk', async (request, env: Env) => {
  try {
    const url = new URL(request.url);
    const x = url.searchParams.get('x');
    const z = url.searchParams.get('z');

    if (!x || !z) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Missing chunk coordinates' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    const chunkX = parseInt(x, 10);
    const chunkZ = parseInt(z, 10);
    const pattern = `${chunkX}-${chunkZ}-%`;

    const result = await env.DB.prepare(
      `SELECT flower_id, note FROM notes WHERE flower_id LIKE ? ORDER BY created_at DESC`
    )
      .bind(pattern)
      .all();

    const flowers = (result.results || []).map((row: any) => ({
      flower_id: row.flower_id,
      note: row.note,
    }));

    return addCorsHeaders(
      new Response(JSON.stringify({ flowers }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60',
        },
      })
    );
  } catch (error) {
    console.error('Error fetching chunk:', error);
    return addCorsHeaders(
      new Response(JSON.stringify({ error: 'Internal server error', flowers: [] }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});

/**
 * GET /api/note?flower_id=<flowerId>
 */
router.get('/api/note', async (request, env: Env) => {
  try {
    const url = new URL(request.url);
    const flowerId = url.searchParams.get('flower_id');

    if (!flowerId) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'Missing flower_id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    const result = await env.DB.prepare(
      `SELECT note FROM notes WHERE flower_id = ? LIMIT 1`
    )
      .bind(flowerId)
      .first();

    if (!result) {
      return addCorsHeaders(
        new Response(JSON.stringify({ error: 'Note not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    }

    return addCorsHeaders(
      new Response(JSON.stringify(result), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      })
    );
  } catch (error) {
    console.error('Error fetching note:', error);
    return addCorsHeaders(
      new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});

/**
 * POST /api/note
 */
router.post('/api/note', async (request, env: Env) => {
  try {
const body = await request.json();

if (
  typeof body !== "object" ||
  body === null ||
  !("flower_id" in body) ||
  !("note" in body)
) {
  return new Response(JSON.stringify({ error: "Invalid body" }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

const { flower_id, note } = body as {
  flower_id: string;
  note: string;
    };

    if (typeof note !== 'string' || note.length === 0 || note.length > 5000) {
      return addCorsHeaders(
        new Response(
          JSON.stringify({ error: 'Note must be between 1 and 5000 characters' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    }

    const id = crypto.randomUUID();
    const createdAt = Math.floor(Date.now() / 1000);

    try {
      await env.DB.prepare(
        `INSERT INTO notes (id, flower_id, note, created_at) VALUES (?, ?, ?, ?)`
      )
        .bind(id, flower_id, note, createdAt)
        .run();

      return addCorsHeaders(
        new Response(
          JSON.stringify({
            success: true,
            flower_id,
            id,
          }),
          {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );
    } catch (dbError: any) {
      if (dbError.message?.includes('UNIQUE') || dbError.message?.includes('constraint')) {
        return addCorsHeaders(
          new Response(
            JSON.stringify({
              success: false,
              flower_id,
              message: 'This flower already has a note',
            }),
            {
              status: 409,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        );
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error creating note:', error);
    return addCorsHeaders(
      new Response(JSON.stringify({ error: 'Internal server error', success: false }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});

/**
 * 404 handler
 */
router.all('*', () => {
  return addCorsHeaders(
    new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  );
});

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) =>
    router.handle(request, env, ctx).catch((error : unknown) => {
      console.error('Router error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
};
