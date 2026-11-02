import path from 'path';
import express from 'express';
import { app, PORT, isServerless, __dirname } from './src/serverApp';

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  const server = app.listen(PORT, () => {
    console.log(`Server RIDHO OK QURBAN running on port ${PORT}`);
  });

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }
}

if (!isServerless) {
  startServer();
}

export default app;
export { app };
