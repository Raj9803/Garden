/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
}

const ALLOWED_ORIGINS = [
  "https://garden-582.pages.dev",
  "http://localhost:3000",
];

const FLOWER_ID_PATTERN = /^-?\d+-\d+-\d+$/;

function corsHeaders(request: Request) {
  const origin = request.headers.get("Origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request);

    function json(data: unknown, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);

    // GET /chunk?x=<chunkX>&z=<chunkZ>
    if (url.pathname === "/chunk" && request.method === "GET") {
      const x = url.searchParams.get("x");
      const z = url.searchParams.get("z");

      if (!x || !z) {
        return json({ error: "Missing chunk coordinates", flowers: [] }, 400);
      }

      const chunkX = parseInt(x, 10);
      const chunkZ = parseInt(z, 10);
      const pattern = `${chunkX}-${chunkZ}-%`;

      try {
        const result = await env.DB.prepare(
          `SELECT flower_id, note FROM notes WHERE flower_id LIKE ? ORDER BY created_at DESC`
        )
          .bind(pattern)
          .all();

        const flowers = (result.results || []).map((row: any) => ({
          flower_id: row.flower_id,
          note: row.note,
        }));

        return json({ flowers });
      } catch (err) {
        console.error("Error fetching chunk:", err);
        return json({ error: "Internal server error", flowers: [] }, 500);
      }
    }

    // GET /note?flower_id=<flowerId>
    if (url.pathname === "/note" && request.method === "GET") {
      const flowerId = url.searchParams.get("flower_id");

      if (!flowerId) {
        return json({ error: "Missing flower_id" }, 400);
      }

      try {
        const result = await env.DB.prepare(
          `SELECT note FROM notes WHERE flower_id = ? LIMIT 1`
        )
          .bind(flowerId)
          .first();

        if (!result) {
          return json({ error: "Note not found" }, 404);
        }

        return json(result);
      } catch (err) {
        console.error("Error fetching note:", err);
        return json({ error: "Internal server error" }, 500);
      }
    }

    // POST /note
    if (url.pathname === "/note" && request.method === "POST") {
      try {
        const body = await request.json() as any;

        if (!body || typeof body !== "object" || !body.flower_id || !body.note) {
          return json({ error: "Invalid body" }, 400);
        }

        const { flower_id, note: rawNote } = body as { flower_id: string; note: string };

        if (typeof flower_id !== "string" || !FLOWER_ID_PATTERN.test(flower_id)) {
          return json({ error: "Invalid flower_id" }, 400);
        }

        const note = typeof rawNote === "string" ? rawNote.trim() : "";

        if (note.length === 0 || note.length > 5000) {
          return json({ error: "Note must be between 1 and 5000 characters" }, 400);
        }

        const id = crypto.randomUUID();
        const createdAt = Math.floor(Date.now() / 1000);

        try {
          await env.DB.prepare(
            `INSERT INTO notes (id, flower_id, note, created_at) VALUES (?, ?, ?, ?)`
          )
            .bind(id, flower_id, note, createdAt)
            .run();

          return json({ success: true, flower_id, id }, 201);
        } catch (dbError: any) {
          // If note already exists, UPDATE it instead
          if (
            dbError.message?.includes("UNIQUE") ||
            dbError.message?.includes("constraint")
          ) {
            await env.DB.prepare(
              `UPDATE notes SET note = ?, created_at = ? WHERE flower_id = ?`
            )
              .bind(note, createdAt, flower_id)
              .run();

            return json({ success: true, flower_id }, 200);
          }
          throw dbError;
        }
      } catch (err) {
        console.error("Error saving note:", err);
        return json({ error: "Internal server error", success: false }, 500);
      }
    }

    return new Response("Not Found", { status: 404, headers: cors });
  },
};
