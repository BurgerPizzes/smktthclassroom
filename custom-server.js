const { createServer } = require('http');

// We'll use next's built-in handler
const next = require('next');
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    return handle(req, res);
  }).listen(3001, '0.0.0.0', () => {
    console.log('> Custom server listening on 0.0.0.0:3001');
  });
});
