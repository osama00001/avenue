import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fs from 'fs';
import path from 'path';

const dev = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

console.log("> Initializing Next.js app...");
app.prepare().then(() => {
    console.log("> App prepared, starting server...");
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            const pathname = parsedUrl.pathname;

            // INTERCEPT COVERS AND SERVE DIRECTLY (Bypass Next.js memory limits)
            if (pathname && pathname.startsWith('/covers/')) {
                const filePath = path.join(process.cwd(), 'covers_storage', pathname.replace('/covers/', ''));
                if (fs.existsSync(filePath)) {
                    res.setHeader('Content-Type', 'image/jpeg');
                    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                    fs.createReadStream(filePath).pipe(res);
                    return;
                }
            }

            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    }).listen(port, () => {
        console.log(`> Ready on port ${port}`);
    });
}).catch(err => {
    console.error("> Failed to prepare app:");
    console.error(err.stack);
    process.exit(1);
});