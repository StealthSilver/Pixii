import mongoose from "mongoose";

/** Prefer MONGODB_URI; DATABASE_URL is a common fallback (e.g. Vercel). */
const MONGODB_URI =
  process.env.MONGODB_URI?.trim() || process.env.DATABASE_URL?.trim();

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const g = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cache: MongooseCache = g.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!g.mongooseCache) {
  g.mongooseCache = cache;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "Missing database URL. Set MONGODB_URI or DATABASE_URL in .env.local (see .env.example).",
    );
  }
  if (cache.conn) {
    return cache.conn;
  }
  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI);
  }
  cache.conn = await cache.promise;
  return cache.conn;
}
