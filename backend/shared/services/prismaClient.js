const path = require('path')

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

let prisma;

try {

    const DB_PW = process.env.DB_PW
    const DB_NAME = process.env.DB_NAME
    console.log('DB_URL:', process.env.DATABASE_URL ? 'gesetzt' : 'NICHT gesetzt');
    
    const pool = new Pool({
        user: 'postgres',
        password: DB_PW,
        host: 'localhost',
        port: 5432,
        database: DB_NAME
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