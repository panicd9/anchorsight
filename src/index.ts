// @ts-nocheck
// src/cli.ts
import { Command } from 'commander';
import express from 'express';
import fs from 'fs';
import path from 'path';
import open from 'open';

const program = new Command();

program
  .command('start')
  .description('Start the Seastate UI')
  .requiredOption('--rpc-url <url>', 'Solana RPC URL')
  .requiredOption('--idl <path>', 'Path to IDL file')
  .action(async (options: { idl: any; rpcUrl: any; }) => {
    const app = express();
    const port = 3000;

    // Read IDL file
    const idlPath = path.resolve(process.cwd(), options.idl);
    const idlContent = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

    // Serve Vite build output
    const clientPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientPath));

    // Inject RPC URL into React app
    app.get('/', (req, res) => {
      const indexHtml = fs.readFileSync(
        path.join(clientPath, 'index.html'), 
        'utf-8'
      );
      const injectedHtml = indexHtml.replace(
        '<!-- CONFIG -->',
        `<script>
          window.__RPC_URL__ = "${options.rpcUrl}";
          window.__IDL_PATH__ = "${options.idl}";
        </script>`
      );
      res.send(injectedHtml);
    });

    // Serve IDL endpoint
    app.get('/get-idl', (req, res) => {
      res.json(idlContent);
    });

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      open(`http://localhost:${port}`);
    });
  });

program.parse(process.argv);