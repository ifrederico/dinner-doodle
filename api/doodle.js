import { createHash, timingSafeEqual } from "node:crypto";

const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

// Two tiles: the easiest possible, and one with a few more details.
const STYLES = {
  1: "super simple doodle with as few lines as possible, something a child could copy in 30 seconds",
  2: "simple doodle with just a few details, like a quick napkin sketch anyone could copy in a minute",
};

function buildPrompt(subject, level) {
  return [
    `Draw ${subject} as a ${STYLES[level]}.`,
    "Black ballpoint pen line art on plain white paper, drawn quickly by hand. Not a coloring-book page.",
    "Clean single-weight outlines only: no shading, no gray, no color, no text, no background scenery.",
    "Center the whole subject with white space around it.",
  ].join(" ");
}

function json(body, status = 200) {
  return Response.json(body, { status });
}

const sha256 = (value) => createHash("sha256").update(value).digest();

function passcodeOk(request) {
  const given = (request.headers.get("x-passcode") || "").trim();
  return timingSafeEqual(sha256(given), sha256(process.env.DOODLE_PASSCODE));
}

function configError() {
  if (!process.env.OPENAI_API_KEY || !process.env.DOODLE_PASSCODE) {
    return json({ error: "The server is missing OPENAI_API_KEY or DOODLE_PASSCODE." }, 500);
  }
}

// GET checks the passcode without spending anything.
export function GET(request) {
  const error = configError();
  if (error) return error;
  if (!passcodeOk(request)) return json({ error: "Wrong passcode." }, 401);
  return json({ ok: true });
}

export async function POST(request) {
  const error = configError();
  if (error) return error;
  if (!passcodeOk(request)) return json({ error: "Wrong passcode." }, 401);

  const body = await request.json().catch(() => ({}));
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const level = Number(body.level);
  if (!subject || subject.length > 60) return json({ error: "Type 1 to 60 characters." }, 400);
  if (!STYLES[level]) return json({ error: "Level must be 1 or 2." }, 400);

  let res, data;
  try {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: buildPrompt(subject, level),
        n: 1,
        size: "1024x1024",
        quality: "low",
        background: "opaque",
        output_format: "webp",
        output_compression: 80,
        // Cartoon chases and shootouts are part of the game; "auto" blocks too many of them.
        moderation: "low",
      }),
    });
    data = await res.json().catch(() => ({}));
  } catch {
    return json({ error: "Couldn't reach OpenAI. Try again." }, 502);
  }

  if (!res.ok) {
    const message = data.error?.message || `OpenAI error ${res.status}.`;
    return json({ error: message.slice(0, 200) }, 502);
  }
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) return json({ error: "No doodle came back. Try again." }, 502);
  return json({ image: `data:image/webp;base64,${b64}` });
}
