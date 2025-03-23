"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-nocheck
// src/cli.ts
const commander_1 = require("commander");
const express_1 = require("express");
const fs_1 = require("fs");
const path_1 = require("path");
const open_1 = require("open");
const program = new commander_1.Command();
program
    .command('start')
    .description('Start the Seastate UI')
    .requiredOption('--rpc-url <url>', 'Solana RPC URL')
    .requiredOption('--idl <path>', 'Path to IDL file')
    .action(async (options) => {
    const app = (0, express_1.default)();
    const port = 3000;
    // Read IDL file
    const idlPath = path_1.default.resolve(process.cwd(), options.idl);
    const idlContent = JSON.parse(fs_1.default.readFileSync(idlPath, 'utf-8'));
    // Serve Vite build output
    const clientPath = path_1.default.join(__dirname, '../../client/dist');
    app.use(express_1.default.static(clientPath));
    // Inject RPC URL into React app
    app.get('/', (req, res) => {
        const indexHtml = fs_1.default.readFileSync(path_1.default.join(clientPath, 'index.html'), 'utf-8');
        const injectedHtml = indexHtml.replace('<!-- CONFIG -->', `<script>
          window.__RPC_URL__ = "${options.rpcUrl}";
          window.__IDL_PATH__ = "${options.idl}";
        </script>`);
        res.send(injectedHtml);
    });
    // Serve IDL endpoint
    app.get('/get-idl', (req, res) => {
        res.json(idlContent);
    });
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
        (0, open_1.default)(`http://localhost:${port}`);
    });
});
program.parse(process.argv);
//# sourceMappingURL=index.js.map