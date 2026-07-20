/**
 * JAHEEZ dev proxy — port 5000 (public)
 *   /admin/* → Vite admin panel at port 3000
 *   everything else → Metro (Expo) at port 8081
 */

const http = require('http');
const net  = require('net');

const PUBLIC_PORT    = 5000;
const METRO_PORT     = 8081;
const DRIVER_PORT    = 8082;
const ADMIN_PORT     = 3000;
const NEW_MVC_API_PORT = 3002;
const MOCKUP_PORT    = 23636;

/* ─── Metro readiness gate ──────────────────────────────────────────────── */
let metroReady = false;
const requestQueue = [];

function pollMetro() {
  const probe = http.get(
    { hostname: 'localhost', port: METRO_PORT, path: '/', timeout: 2000 },
    (res) => {
      res.resume();
      if (!metroReady) {
        metroReady = true;
        console.log('[JAHEEZ proxy] Metro ready — flushing ' + requestQueue.length + ' queued requests');
        while (requestQueue.length) {
          const { req, res } = requestQueue.shift();
          proxyHTTP(req, res, METRO_PORT);
        }
      }
    }
  );
  probe.on('error',   () => setTimeout(pollMetro, 800));
  probe.on('timeout', () => { probe.destroy(); setTimeout(pollMetro, 800); });
}

pollMetro();

/* ─── Generic HTTP proxy to a given port ───────────────────────────────── */
function proxyHTTP(req, res, targetPort) {
  const isDriverBundle = targetPort === DRIVER_PORT && (
    req.url.includes('.bundle') ||
    (req.url.includes('.js') && !req.url.includes('.json'))
  );

  const fwdHeaders = Object.assign({}, req.headers, { host: 'localhost:' + targetPort });
  delete fwdHeaders['origin'];
  delete fwdHeaders['referer'];
  if (isDriverBundle) {
    delete fwdHeaders['accept-encoding'];
    delete fwdHeaders['if-none-match'];
    delete fwdHeaders['if-modified-since'];
  }

  const opts = {
    hostname: 'localhost',
    port:     targetPort,
    path:     req.url,
    method:   req.method,
    headers:  fwdHeaders,
  };

  const upstream = http.request(opts, (upRes) => {
    if (isDriverBundle && upRes.statusCode === 200) {
      let body = '';
      upRes.on('data', (chunk) => {
        body += chunk.toString();
      });
      upRes.on('end', () => {
        const modified = body
          .replace(/\/hot`/g, '/hot?app=driver`')
          .replace(/\/hot"/g, '/hot?app=driver"')
          .replace(/\/hot'/g, "/hot?app=driver'")
          .replace(/\/message`/g, '/message?app=driver`')
          .replace(/\/message"/g, '/message?app=driver"')
          .replace(/\/message'/g, "/message?app=driver'");

        const updatedHeaders = Object.assign({}, upRes.headers);
        updatedHeaders['content-length'] = Buffer.byteLength(modified);
        delete updatedHeaders['content-encoding'];
        delete updatedHeaders['etag'];
        delete updatedHeaders['last-modified'];

        res.writeHead(upRes.statusCode || 200, updatedHeaders);
        res.end(modified);
      });
    } else {
      res.writeHead(upRes.statusCode || 200, upRes.headers);
      upRes.pipe(res, { end: true });
    }
  });

  upstream.on('error', (err) => {
    console.error('[JAHEEZ proxy] upstream error (' + targetPort + '):', err.message, req.url);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end('Upstream unavailable (' + targetPort + '): ' + err.message);
    }
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    upstream.end();
  } else {
    req.pipe(upstream, { end: true });
  }
}

/* ─── Branded loading HTML (user app) ──────────────────────────────────── */
const LOADING_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no"/>
  <title>JAHEEZ — جاهز</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{height:100%;background:#0A0A12;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
    #root{display:flex;height:100%;flex:1}
    #_jl{
      position:fixed;inset:0;display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      background:linear-gradient(160deg,#0B0C1E 0%,#1A0606 40%,#7F0000 80%,#C62828 100%);
      z-index:9999;transition:opacity .35s ease
    }
    #_jl.out{opacity:0;pointer-events:none}
    .jl-logo{font-size:52px;font-weight:900;color:#F2C94C;letter-spacing:-1px;margin-bottom:4px}
    .jl-ar{font-size:20px;color:rgba(255,255,255,.6);margin-bottom:48px}
    .jl-spin{width:36px;height:36px;border-radius:50%;border:3px solid rgba(255,255,255,.15);border-top-color:#EF4444;animation:sp .75s linear infinite}
    @keyframes sp{to{transform:rotate(360deg)}}
  </style>
</head>
<body>
  <div id="_jl">
    <div class="jl-logo">JaheeZ</div>
    <div class="jl-ar">جاهز</div>
    <div class="jl-spin"></div>
  </div>
  <div id="root"></div>
  <script>
    (function(){
      var root=document.getElementById('root');
      var loader=document.getElementById('_jl');
      if(!root||!loader)return;
      var mo=new MutationObserver(function(){
        if(root.children.length>0){
          loader.classList.add('out');
          setTimeout(function(){if(loader.parentNode)loader.parentNode.removeChild(loader);},400);
          mo.disconnect();
        }
      });
      mo.observe(root,{childList:true,subtree:true});
    })();
  </script>
  <script src="/node_modules/expo-router/entry.bundle?platform=web&dev=true&hot=false&lazy=true&transform.engine=hermes&transform.routerRoot=app&unstable_transformProfile=hermes-stable" defer></script>
</body>
</html>`;

/* ─── Route helpers ─────────────────────────────────────────────────────── */
function isAdminApiPath(url) {
  return url.startsWith('/admin-api/') || url === '/admin-api';
}


function isMockupPath(url) {
  return url.startsWith('/__mockup')
    || url.startsWith('/@fs/')
    || url.startsWith('/node_modules/.vite/deps/');
}

function isAdminPath(url) {
  return url === '/admin'
    || url.startsWith('/admin/')
    || url.startsWith('/__admin_hmr')
    || url.startsWith('/@vite/')
    || url.startsWith('/@react-refresh')
    || url.startsWith('/node_modules/.vite');
}

function isDriverPath(url) {
  // Driver app served under /driver baseUrl (expo-router web baseUrl).
  // Also catches its bundle/asset paths under /driver/_expo, /driver/assets, etc.
  return url === '/driver' || url.startsWith('/driver/');
}

// Driver-app HTML emits absolute asset paths like "/node_modules/expo-router/entry.bundle?...&transform.baseUrl=%2Fdriver"
// and "/assets/..." which (without help) hit the user-app Metro and produce "Unmatched Route".
// Only asset-like paths are eligible (avoid misrouting arbitrary requests). Within that,
// detect driver-context by Referer (/driver/...) OR by query string baseUrl=%2Fdriver.
function isDriverAssetByContext(req, url) {
  const cleanUrl = url.split('?')[0];
  const isAssetLike =
       cleanUrl.startsWith('/node_modules/')
    || cleanUrl.startsWith('/assets/')
    || cleanUrl.startsWith('/_expo/')
    || cleanUrl.startsWith('/symbolicate')
    || cleanUrl === '/favicon.ico';
  if (!isAssetLike) return false;

  const qs = url.split('?')[1] || '';
  if (qs.includes('baseUrl=%2Fdriver') || qs.includes('baseUrl=/driver')) return true;

  const ref = req.headers.referer || req.headers.referrer || '';
  try {
    if (ref) {
      const u = new URL(ref);
      if (u.pathname === '/driver' || u.pathname.startsWith('/driver/')) return true;
    }
  } catch {}
  return false;
}

/* ─── HTTP server ───────────────────────────────────────────────────────── */
const server = http.createServer((req, res) => {
  const url = (req.url || '/');

  // Socket.IO polling → Port 3002 (Express MVC backend)
  if (url.startsWith('/socket.io/')) {
    proxyHTTP(req, res, NEW_MVC_API_PORT);
    return;
  }

  // Admin API → Express at port 3002 (Express MVC backend)
  if (isAdminApiPath(url)) {
    proxyHTTP(req, res, NEW_MVC_API_PORT);
    return;
  }

  // Mockup sandbox → Vite at port 23636
  if (isMockupPath(url)) {
    proxyHTTP(req, res, MOCKUP_PORT);
    return;
  }

  // Redirect bare /admin to /admin/
  if (url === '/admin') {
    res.writeHead(301, { Location: '/admin/' });
    res.end();
    return;
  }

  // Admin panel → Vite at port 3000
  if (isAdminPath(url)) {
    proxyHTTP(req, res, ADMIN_PORT);
    return;
  }

  // Driver app → Metro at port 8082
  if (url === '/driver') {
    res.writeHead(301, { Location: '/driver/' });
    res.end();
    return;
  }
  if (isDriverPath(url)) {
    proxyHTTP(req, res, DRIVER_PORT);
    return;
  }
  // Absolute asset paths emitted by driver-app HTML (e.g. /node_modules/...&baseUrl=%2Fdriver,
  // /assets/..., /_expo/...) — route to driver Metro based on Referer or query string.
  if (isDriverAssetByContext(req, url)) {
    proxyHTTP(req, res, DRIVER_PORT);
    return;
  }

  const cleanUrl = url.split('?')[0];
  const isRoot   = (cleanUrl === '/' || cleanUrl === '/index.html') && req.method === 'GET';

  if (isRoot) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(LOADING_HTML);
    return;
  }

  // User app (Metro) — queue if not ready yet
  if (!metroReady) {
    console.log('[JAHEEZ proxy] queuing request (Metro not ready):', req.url);
    requestQueue.push({ req, res });
    return;
  }

  proxyHTTP(req, res, METRO_PORT);
});

/* ─── WebSocket / HMR upgrade proxy ────────────────────────────────────── */
server.on('upgrade', (req, clientSocket, head) => {
  const url        = req.url || '/';
  const targetPort = url.startsWith('/socket.io/') ? NEW_MVC_API_PORT
    : isMockupPath(url) ? MOCKUP_PORT
    : isAdminPath(url)  ? ADMIN_PORT
    : isDriverPath(url) ? DRIVER_PORT
    : isDriverAssetByContext(req, url) ? DRIVER_PORT
    : url.includes('app=driver') ? DRIVER_PORT
    : METRO_PORT;

  console.log('[JAHEEZ proxy] WS upgrade request:', url, '-> targetPort:', targetPort);

  const doUpgrade = () => {
    const conn = net.connect(targetPort, 'localhost', () => {
      const headers = [
        `${req.method} ${req.url} HTTP/1.1`,
        ...Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`),
        '', '',
      ].join('\r\n');
      conn.write(headers);
      if (head && head.length) conn.write(head);
      conn.pipe(clientSocket);
      clientSocket.pipe(conn);
    });
    conn.on('error', (err) => {
      console.error(`[JAHEEZ proxy] WS connection error to port ${targetPort}:`, err.message);
      clientSocket.destroy();
    });
    clientSocket.on('error', (err) => {
      console.error(`[JAHEEZ proxy] WS clientSocket error:`, err.message);
      conn.destroy();
    });
  };

  if (targetPort === ADMIN_PORT || targetPort === NEW_MVC_API_PORT || metroReady) {
    doUpgrade();
  } else {
    const wait = setInterval(() => {
      if (metroReady) { clearInterval(wait); doUpgrade(); }
    }, 500);
  }
});

/* ─── Start ─────────────────────────────────────────────────────────────── */
server.on('error', (err) => {
  console.error('[JAHEEZ proxy] fatal:', err.message);
  process.exit(1);
});

server.listen(PUBLIC_PORT, () => {
  console.log('[JAHEEZ proxy] :' + PUBLIC_PORT + ' → Metro :' + METRO_PORT + ' | Admin :' + ADMIN_PORT + ' (/admin/*) | Driver :' + DRIVER_PORT + ' (/driver/*)');
});
