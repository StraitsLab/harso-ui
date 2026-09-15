#!/usr/bin/env python3
"""Minimal MCP-over-HTTP client for Sketch (streamable HTTP). Usage: sk.py <tool> [json-args]  |  sk.py --list"""
import json, sys, os, re, urllib.request, fcntl

URL = os.environ.get("SKETCH_MCP_URL", "http://localhost:31126/mcp")
SESSION_FILE = "/tmp/harso-sketch/session.txt"
os.makedirs("/tmp/harso-sketch", exist_ok=True)

def post(payload, session=None):
    req = urllib.request.Request(URL, data=json.dumps(payload).encode(), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json, text/event-stream")
    if session: req.add_header("Mcp-Session-Id", session)
    with urllib.request.urlopen(req, timeout=180) as r:
        sid = r.headers.get("Mcp-Session-Id")
        body = r.read().decode()
    # SSE or JSON
    if body.lstrip().startswith("{"):
        return json.loads(body), sid
    msgs = [json.loads(l[5:].strip()) for l in body.splitlines() if l.startswith("data:")]
    return (msgs[-1] if msgs else {}), sid

def session():
    if os.path.exists(SESSION_FILE):
        return open(SESSION_FILE).read().strip() or None
    return None

def init():
    res, sid = post({"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-03-26", "capabilities": {}, "clientInfo": {"name": "hermes-harso", "version": "1"}}})
    if sid: open(SESSION_FILE, "w").write(sid)
    try:
        post({"jsonrpc": "2.0", "method": "notifications/initialized"}, sid)
    except Exception:
        pass
    return sid

def call(method, params, retry=True):
    sid = session() or init()
    try:
        res, _ = post({"jsonrpc": "2.0", "id": 2, "method": method, "params": params}, sid)
    except urllib.error.HTTPError as e:
        if retry and e.code in (400, 404):
            sid = init()
            return call(method, params, retry=False)
        raise
    if "error" in res and retry and str(res["error"]).find("session") >= 0:
        init(); return call(method, params, retry=False)
    return res

if __name__ == "__main__":
    if sys.argv[1] == "--list":
        r = call("tools/list", {})
        for t in r.get("result", {}).get("tools", []): print(t["name"], "-", t.get("description", "")[:90].replace("\n", " "))
        sys.exit(0)
    tool = sys.argv[1]; args = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    if tool == "run_code" and "code_file" in args:
        body = open(args.pop("code_file")).read()
        prelude = os.environ.get("SK_PRELUDE", "/tmp/harso-sk/lib.js")
        if os.path.exists(prelude) and "// NO_PRELUDE" not in body:
            body = open(prelude).read() + "\n" + body
        args["script"] = body
    lock = open("/tmp/harso-sk/sketch.lock", "w"); fcntl.flock(lock, fcntl.LOCK_EX)
    r = call("tools/call", {"name": tool, "arguments": args})
    if "error" in r: print("ERROR", json.dumps(r["error"])[:2000]); sys.exit(1)
    out = r.get("result", {})
    for c in out.get("content", []):
        if c.get("type") == "text":
            txt = c["text"]; m = re.search(r"generated at (/\S+\.png)", txt)
            if m and tool == "get_screenshot":
                import shutil; p = f"/tmp/harso-sk/shots/{os.environ.get('SK_TAG','last')}.png"; shutil.copy(m.group(1), p); print("IMAGE", p)
            else: print(txt[:int(os.environ.get("SK_MAX", "6000"))])
        elif c.get("type") == "image":
            p = f"/tmp/harso-sk/shots/{os.environ.get('SK_TAG','last')}.png"
            import base64; open(p, "wb").write(base64.b64decode(c["data"])); print("IMAGE", p)
    if out.get("isError"): sys.exit(1)
