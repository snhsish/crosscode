import http from "http"
import type { AddressInfo } from "net"
import QRCode from "qrcode"
import { encodeQrPayload } from "@crosscode/shared"
import { debug } from "./util"

export type ConnectionInfo = {
    url: string
    token: string
    ready: boolean
}

// Mutable, process-wide connection state. The providers populate it once the
// tunnel URL is ready; the page server reads it lazily so the browser tab
// always shows the current URL/token (and keeps working across reconnects).
let state: ConnectionInfo = { url: "", token: "", ready: false }
let server: http.Server | null = null
let serverPort = 0

export function setConnectionInfo(patch: Partial<ConnectionInfo>) {
    state = { ...state, ...patch }
    debug("connection info updated", { ready: state.ready, hasUrl: !!state.url, hasToken: !!state.token })
}

export function getConnectionInfo(): ConnectionInfo {
    return state
}

/**
 * Bound to 127.0.0.1 only, so unlike the opencode proxy it is never reachable
 * through the tunnel — the auth token can never leak to the public URL.
 */
export function startConnectionServer(): Promise<number> {
    if (server) return Promise.resolve(serverPort)
    return new Promise((resolve, reject) => {
        const srv = http.createServer(handleRequest)
        srv.once("error", reject)
        srv.listen(0, "127.0.0.1", () => {
            server = srv
            serverPort = (srv.address() as AddressInfo).port
            debug("connection page server listening", { port: serverPort })
            resolve(serverPort)
        })
    })
}

export function connectionPageUrl(): string {
    return serverPort ? `http://127.0.0.1:${serverPort}/` : ""
}

export function closeConnectionServer(): void {
    server?.close()
    server = null
}

function send(res: http.ServerResponse, status: number, headers: Record<string, string>, body: Buffer | string) {
    res.writeHead(status, {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "Referrer-Policy": "no-referrer",
        ...headers,
    })
    res.end(body)
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method !== "GET") {
        send(res, 405, { "Content-Type": "text/plain; charset=utf-8", "Allow": "GET" }, "Method Not Allowed")
        return
    }

    const path = (req.url || "/").split("?")[0]

    if (path === "/") {
        send(res, 200, { "Content-Type": "text/html; charset=utf-8" }, PAGE_HTML)
        return
    }

    if (path === "/data") {
        send(res, 200, { "Content-Type": "application/json; charset=utf-8" }, JSON.stringify(state))
        return
    }

    if (path === "/qr.png") {
        if (!state.ready || !state.url || !state.token) {
            send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not ready")
            return
        }
        try {
            const payload = encodeQrPayload({ url: state.url, token: state.token, v: 1 })
            const png = await QRCode.toBuffer(payload, { type: "png", errorCorrectionLevel: "M", margin: 2, width: 480 })
            send(res, 200, { "Content-Type": "image/png", "Content-Length": String(png.length) }, png)
        } catch (err) {
            debug("qr png render failed", { error: err instanceof Error ? err.message : String(err) })
            send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Failed to render QR")
        }
        return
    }

    send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not Found")
}

const PAGE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>CrossCode Connection</title>
<style>
:root{color-scheme:light dark;--bg:#f6f6f7;--fg:#111;--muted:#666;--card:#fff;--border:#e2e2e5;--accent:#5b5bd6}
@media (prefers-color-scheme:dark){:root{--bg:#111114;--fg:#eee;--muted:#9a9aa2;--card:#1b1b1f;--border:#2c2c32;--accent:#8b8bff}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;padding:24px}
.card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px;text-align:center}
h1{margin:0 0 4px;font-size:20px}
.sub{margin:0 0 20px;color:var(--muted);font-size:14px}
.qr-wrap{position:relative;display:flex;align-items:center;justify-content:center;width:288px;height:288px;margin:0 auto 12px;background:#fff;border-radius:12px;padding:12px}
.qr-wrap img{width:100%;height:100%;display:none}
.qr-wrap.ready img{display:block}
.waiting{color:var(--muted);font-size:13px}
.qr-wrap.ready .waiting{display:none}
.btn{display:inline-block;margin-bottom:20px;padding:8px 14px;border-radius:9px;border:1px solid var(--border);background:transparent;color:var(--fg);font-size:13px;text-decoration:none;cursor:pointer}
.btn:hover{border-color:var(--accent);color:var(--accent)}
label{display:block;text-align:left;font-size:12px;color:var(--muted);margin-bottom:12px}
.field{display:flex;gap:6px;margin-top:5px}
input{flex:1;min-width:0;padding:9px 10px;border:1px solid var(--border);border-radius:9px;background:var(--bg);color:var(--fg);font:13px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}
input:focus{outline:none;border-color:var(--accent)}
.field button{padding:0 12px;border:1px solid var(--border);border-radius:9px;background:transparent;color:var(--fg);font-size:12px;cursor:pointer}
.field button:hover{border-color:var(--accent);color:var(--accent)}
.muted{color:var(--muted);font-size:12px;margin:8px 0 0}
</style>
</head>
<body>
<main class="card">
  <h1>Connect CrossCode</h1>
  <p class="sub">Scan this code with the CrossCode app.</p>
  <div class="qr-wrap" id="qrwrap">
    <img id="qr" alt="Connection QR code" width="264" height="264">
    <span class="waiting" id="waiting">Waiting for tunnel…</span>
  </div>
  <a class="btn" id="download" href="/qr.png" download="crosscode-qr.png" style="display:none">Download QR</a>
  <label>Tunnel URL
    <span class="field"><input id="url" type="text" readonly placeholder="waiting…"><button type="button" data-copy="url">Copy</button></span>
  </label>
  <label>Auth token
    <span class="field"><input id="token" type="password" readonly placeholder="waiting…"><button type="button" id="reveal">Show</button><button type="button" data-copy="token">Copy</button></span>
  </label>
  <p class="muted">You can close this tab once your app is connected.<br>Keep the terminal running.</p>
</main>
<script>
(function(){
  var lastUrl = "";
  var els = {
    wrap: document.getElementById("qrwrap"),
    qr: document.getElementById("qr"),
    download: document.getElementById("download"),
    url: document.getElementById("url"),
    token: document.getElementById("token"),
    reveal: document.getElementById("reveal")
  };
  function copy(el){
    el.removeAttribute("readonly");
    el.select();
    el.setSelectionRange(0, el.value.length);
    try { document.execCommand("copy"); } catch(e){}
    if (navigator.clipboard) navigator.clipboard.writeText(el.value).catch(function(){});
    el.setAttribute("readonly", "");
    window.getSelection && window.getSelection().removeAllRanges();
  }
  document.querySelectorAll("[data-copy]").forEach(function(btn){
    btn.addEventListener("click", function(){
      var el = els[btn.getAttribute("data-copy")];
      if (el && el.value) copy(el);
    });
  });
  els.reveal.addEventListener("click", function(){
    var hidden = els.token.type === "password";
    els.token.type = hidden ? "text" : "password";
    els.reveal.textContent = hidden ? "Hide" : "Show";
  });
  function refresh(){
    fetch("/data", { cache: "no-store" }).then(function(r){ return r.json(); }).then(function(d){
      if (d.url && d.url !== els.url.value) els.url.value = d.url;
      if (d.token && d.token !== els.token.value) els.token.value = d.token;
      if (d.ready && d.url) {
        if (d.url !== lastUrl) {
          lastUrl = d.url;
          els.qr.src = "/qr.png?t=" + encodeURIComponent(d.url);
        }
        els.wrap.classList.add("ready");
        els.download.style.display = "inline-block";
      }
    }).catch(function(){});
  }
  refresh();
  setInterval(refresh, 3000);
})();
</script>
</body>
</html>
`
