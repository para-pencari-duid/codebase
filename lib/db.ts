import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

// In serverless (Vercel), limit pool size to avoid exhausting Supabase connections.
// Supabase free tier allows max 60 connections; pgbouncer handles pooling on port 6543.
const pool = new Pool({
    connectionString,
    max: process.env.NODE_ENV === "production" ? 2 : 10,
});

const adapter = new PrismaPg(pool);

const prismaClientSingleton = () => {
    return new PrismaClient({ adapter });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

// Use global singleton in development to prevent hot-reload from creating new connections.
// In production (serverless), each function instance gets its own client (fine with pgbouncer).
const db = globalThis.prisma ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
