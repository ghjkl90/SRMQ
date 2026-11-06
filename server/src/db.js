// src/db.js
import pg from 'pg';

// BIGINT(id) 를 문자열이 아닌 숫자로 받습니다. (id 가 2^53 을 넘을 일은 없습니다)
pg.types.setTypeParser(20, (value) => Number.parseInt(value, 10));

export function createDb(connectionString) {
  const pool = new pg.Pool({ connectionString, max: 10, idleTimeoutMillis: 30_000 });

  pool.on('error', (err) => {
    console.error('[db] idle client error', err);
  });

  return {
    pool,
    query: (text, params) => pool.query(text, params),

    /** 트랜잭션: fn(client) 안의 쿼리가 모두 성공해야 반영됩니다. */
    async tx(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },

    end: () => pool.end(),
  };
}
