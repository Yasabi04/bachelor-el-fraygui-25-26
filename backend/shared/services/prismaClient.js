const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let prisma;

try {
    console.log('DB_URL:', process.env.DATABASE_URL ? 'gesetzt' : 'NICHT gesetzt');
    
    const pool = new Pool({
        user: 'postgres',
        password: 'y18assin03!',
        host: 'localhost',
        port: 5432,
        database: 'aurora_bachelor'
    });
    
    const adapter = new PrismaPg(pool);
    
    prisma = new PrismaClient({
        adapter,
        log: ['error', 'warn'],
    });
    
    console.log('Prisma Client erfolgreich initialisiert');
} catch (error) {
    console.error('Prisma Client Initialisierungsfehler:', error);
    throw error;
}

module.exports = prisma;