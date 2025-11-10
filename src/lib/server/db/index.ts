import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-http';
import postgres from 'postgres';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

// Use Neon if DATABASE_URL contains neon.tech, otherwise use postgres-js
const isNeon = env.DATABASE_URL.includes('neon.tech');

export const db = isNeon
	? drizzleNeon(neon(env.DATABASE_URL), { schema })
	: drizzlePostgres(postgres(env.DATABASE_URL), { schema });
