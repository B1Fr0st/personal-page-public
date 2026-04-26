import index from '../index.html';

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: process.env.NODE_ENV !== 'production',
  routes: {
    '/*': index
  }
});

console.log(`Listening on http://localhost:${server.port}`);
