// system/webpair.js
// ✧ موقع تنصيب البوتات الفرعية ✧
// بيشتغل جوا نفس البروسيس بتاع البوت الأساسي (مش سبون لبروسيس منفصل)
// عشان يقدر يوصل لـ global.subBots — بيتشغل تلقائي من index.js.


import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOMAIN = process.env.PAIR_DOMAIN || 'https://uranuos.duckdns.org'
// نفس البورت اللي بلوقن .صفحه بيشغل عليه ngrok (3000) عشان يفضل كل حاجة متوافقة
const FIXED_PORT = Number(process.env.SERVER_PORT || process.env.PORT || 20204)
// نفس مهلة أمر .تنصيب الأصلي (120 ثانية) في plugins/subs/sub.js
const PAIR_TIMEOUT_MS = 120000

function extractNumber(input) {
    let cleaned = String(input || '').replace(/\s+/g, '')
    cleaned = cleaned.replace(/^\+/, '')
    let match = cleaned.match(/\d+/)
    return match ? match[0] : ''
}

function sendJSON(res, status, obj) {
    if (res.headersSent) return
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(obj))
}

function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = ''
        req.on('data', (chunk) => {
            data += chunk
            if (data.length > 1e6) {
                req.destroy()
                reject(new Error('payload too large'))
            }
        })
        req.on('end', () => resolve(data))
        req.on('error', reject)
    })
}

const PAGE_HTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>✧ LYNOX - ربط بوت فرعي ✧</title>
<meta property="og:title" content="✧ LYNOX SYSTEM ✧">
<meta property="og:description" content="ربط بوت فرعي عن طريق الموقع">
<meta property="og:image" content="https://files.catbox.moe/amyy67.jpg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://files.catbox.moe/amyy67.jpg">
<meta name="theme-color" content="#0a0e1a">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Space+Grotesk:wght@700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --bg-0:#0a0e1a;
    --bg-1:#0f1424;
    --violet:#8b7bff;
    --teal:#39e0c4;
    --coral:#ff6f9c;
    --glass-fill: rgba(255,255,255,0.055);
    --glass-fill-strong: rgba(255,255,255,0.09);
    --glass-border: rgba(255,255,255,0.16);
    --glass-border-soft: rgba(255,255,255,0.08);
    --text-0:#f3f4fb;
    --text-1:#c7cbe0;
    --text-2:#8b8fa8;
    --mono:'JetBrains Mono', monospace;
    --display:'Space Grotesk', sans-serif;
    --body:'Tajawal', sans-serif;
  }

  *{ box-sizing:border-box; -webkit-tap-highlight-color: transparent; }

  html,body{
    margin:0; padding:0; min-height:100vh;
    background: var(--bg-0);
    color: var(--text-0);
    font-family: var(--body);
    overflow-x:hidden;
  }

  body{
    position:relative;
    display:flex;
    align-items:center;
    justify-content:center;
    padding: 40px 16px;
  }

  .aurora{
    position:fixed;
    inset:0;
    z-index:0;
    overflow:hidden;
    background:
      radial-gradient(ellipse 120% 80% at 50% -10%, #131a30 0%, var(--bg-0) 60%);
    pointer-events:none;
  }
  .blob{
    position:absolute;
    border-radius:50%;
    filter: blur(64px);
    opacity:0.5;
    will-change: transform;
    transform: translateZ(0);
  }
  .blob.b1{
    width:440px; height:440px;
    background: var(--violet);
    top:-140px; right:-120px;
    animation: float1 28s cubic-bezier(.45,0,.55,1) infinite;
  }
  .blob.b2{
    width:400px; height:400px;
    background: var(--teal);
    bottom:-160px; left:-140px;
    animation: float2 34s cubic-bezier(.45,0,.55,1) infinite;
  }
  .blob.b3{
    width:300px; height:300px;
    background: var(--coral);
    bottom:10%; right:8%;
    opacity:0.3;
    animation: float3 24s cubic-bezier(.45,0,.55,1) infinite;
  }
  @keyframes float1{
    0%{ transform: translate(0,0) scale(1); }
    25%{ transform: translate(-60px, 40px) scale(1.06); }
    50%{ transform: translate(-30px, 90px) scale(1.1); }
    75%{ transform: translate(30px, 40px) scale(1.03); }
    100%{ transform: translate(0,0) scale(1); }
  }
  @keyframes float2{
    0%{ transform: translate(0,0) scale(1); }
    30%{ transform: translate(60px,-30px) scale(1.05); }
    55%{ transform: translate(90px,20px) scale(0.96); }
    80%{ transform: translate(20px,50px) scale(1.02); }
    100%{ transform: translate(0,0) scale(1); }
  }
  @keyframes float3{
    0%{ transform: translate(0,0) scale(1); }
    33%{ transform: translate(-40px,-50px) scale(1.12); }
    66%{ transform: translate(20px,-20px) scale(0.94); }
    100%{ transform: translate(0,0) scale(1); }
  }
  @media (prefers-reduced-motion: reduce){
    .blob{ animation:none !important; }
  }

  .code-glyphs{
    position:fixed; inset:0; z-index:1; pointer-events:none; overflow:hidden;
  }
  .glyph{
    position:absolute;
    font-family: var(--mono);
    color: var(--text-2);
    opacity:0.10;
    font-weight:500;
    user-select:none;
  }
  .glyph.g1{ top:8%; left:8%; font-size:34px; animation: glyphDrift1 26s ease-in-out infinite; }
  .glyph.g2{ top:14%; right:9%; font-size:24px; animation: glyphDrift2 32s ease-in-out infinite; color: var(--teal); opacity:0.12; }
  .glyph.g3{ bottom:14%; left:6%; font-size:26px; animation: glyphDrift3 29s ease-in-out infinite; color: var(--violet); opacity:0.12; }
  .glyph.g4{ bottom:20%; right:8%; font-size:20px; animation: glyphDrift1 24s ease-in-out infinite reverse; }
  @keyframes glyphDrift1{ 0%,100%{ transform: translate(0,0) rotate(0deg); } 50%{ transform: translate(14px,-22px) rotate(-4deg); } }
  @keyframes glyphDrift2{ 0%,100%{ transform: translate(0,0) rotate(0deg); } 50%{ transform: translate(-18px,16px) rotate(5deg); } }
  @keyframes glyphDrift3{ 0%,100%{ transform: translate(0,0) rotate(0deg); } 50%{ transform: translate(12px,20px) rotate(-3deg); } }
  @media (prefers-reduced-motion: reduce){ .glyph{ animation:none !important; } }

  .glass{
    background: var(--glass-fill);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(14px) saturate(120%);
    -webkit-backdrop-filter: blur(14px) saturate(120%);
    box-shadow:
      0 8px 32px rgba(0,0,0,0.35),
      inset 0 1px 0 rgba(255,255,255,0.08);
  }

  .stage{
    position:relative; z-index:2;
    width:100%; max-width:420px;
  }

  .card{
    width:100%;
    border-radius:26px;
    padding: 32px 26px 26px;
    opacity:0;
    animation: rise 0.9s cubic-bezier(.16,1,.3,1) 0.05s forwards;
  }

  .logo{
    text-align:center;
    font-family: var(--display);
    font-size: 28px;
    font-weight:700;
    letter-spacing: 1px;
    margin-bottom: 4px;
    background: linear-gradient(90deg, #ffffff, var(--teal) 60%, var(--violet));
    -webkit-background-clip:text;
    background-clip:text;
    color:transparent;
  }
  .tag-bracket{
    font-family: var(--mono);
    font-weight:500;
    -webkit-text-fill-color: var(--text-2);
    color: var(--text-2);
    opacity:0.7;
  }
  .tag{
    text-align:center;
    font-family: var(--mono);
    font-size:12.5px;
    color: var(--text-2);
    margin-bottom: 24px;
    direction: rtl;
  }

  label{
    font-size:13px; color: var(--text-1); display:block;
    margin-bottom:8px; font-weight:500;
  }
  input[type=text]{
    width:100%; padding:14px 16px; border-radius:14px;
    border:1px solid var(--glass-border);
    background: rgba(6,9,18,0.55);
    color: var(--text-0); font-size:16px; font-family: var(--mono);
    outline:none; direction: ltr; text-align:center; letter-spacing:1px;
    backdrop-filter: blur(6px);
    transition: border-color .2s ease, box-shadow .2s ease;
  }
  input[type=text]:focus{
    border-color: var(--teal);
    box-shadow: 0 0 0 3px rgba(57,224,196,0.18);
  }

  button{
    width:100%; margin-top:16px; padding:14px; border:none; border-radius:14px;
    background: linear-gradient(135deg, rgba(139,123,255,0.35), rgba(57,224,196,0.22));
    border:1px solid var(--glass-border);
    color: var(--text-0); font-size:15px; font-weight:700; cursor:pointer;
    font-family: var(--body);
    backdrop-filter: blur(8px);
    transition: transform .18s cubic-bezier(.34,1.56,.64,1), background .25s ease, border-color .25s ease;
    box-shadow: 0 6px 18px rgba(0,0,0,0.35);
  }
  button:hover{ border-color: rgba(255,255,255,0.3); transform: translateY(-2px); }
  button:active{ transform: scale(0.97); }
  button:disabled{ opacity:0.55; cursor:not-allowed; transform:none; }

  .dev-btn{
    background: var(--glass-fill);
    color: var(--text-1);
    margin-top:10px;
  }

  .hint{ font-size:11px; color: var(--text-2); text-align:center; margin-top:10px; font-family: var(--mono); }

  .result{ margin-top:22px; text-align:center; display:none; }
  .result.show{ display:block; }

  .terminal{
    width:100%;
    border-radius:16px;
    overflow:hidden;
  }
  .terminal-head{
    display:flex; align-items:center; gap:8px;
    padding:10px 14px;
    border-bottom:1px solid var(--glass-border-soft);
    background: rgba(255,255,255,0.03);
  }
  .dot{ width:10px; height:10px; border-radius:50%; opacity:0.85; }
  .dot.r{ background:#ff5f57; }
  .dot.y{ background:#febc2e; }
  .dot.g{ background:#28c840; }
  .terminal-title{
    margin-inline-start:auto;
    font-family: var(--mono); font-size:11.5px; color: var(--text-2);
    direction: ltr;
  }
  .terminal-body{
    padding:22px 16px;
    font-family: var(--mono);
  }
  .code-text{
    font-size:26px; font-weight:700; letter-spacing:4px;
    color: var(--teal); direction: ltr; user-select: all;
  }

  .copy-btn{
    margin-top:10px; background: var(--glass-fill); color: var(--text-1);
    font-size:13px; padding:10px; box-shadow:none;
  }

  .steps{
    text-align:right; font-size:13px; color: var(--text-1);
    margin-top:18px; line-height:2; font-family: var(--body);
  }
  .steps b{ color: var(--teal); font-family: var(--mono); }

  .error{
    margin-top:16px;
    background: rgba(255,111,156,0.08);
    border:1px solid rgba(255,111,156,0.3);
    color: var(--coral);
    padding:10px 14px; border-radius:12px; font-size:13px; text-align:center;
    display:none; backdrop-filter: blur(6px);
  }
  .error.show{ display:block; }

  .spinner{
    display:none; width:22px; height:22px; margin:14px auto 0;
    border:3px solid rgba(255,255,255,0.12); border-top-color: var(--teal);
    border-radius:50%; animation: spin 0.8s linear infinite;
  }
  .spinner.show{ display:block; }
  @keyframes spin{ to{ transform: rotate(360deg); } }

  footer{
    text-align:center; font-size:11.5px; color: var(--text-2);
    margin-top:22px; font-family: var(--mono); direction: ltr;
  }

  @keyframes rise{
    from{ opacity:0; transform: translateY(18px) scale(0.98); }
    to{ opacity:1; transform: translateY(0) scale(1); }
  }
</style>
</head>
<body>

  <div class="aurora">
    <div class="blob b1"></div>
    <div class="blob b2"></div>
    <div class="blob b3"></div>
  </div>
  <div class="code-glyphs">
    <span class="glyph g1">&lt;/&gt;</span>
    <span class="glyph g2">{ }</span>
    <span class="glyph g3">=&gt;</span>
    <span class="glyph g4">#</span>
  </div>

  <main class="stage">
    <div class="card glass">
      <div class="logo"><span class="tag-bracket">✧</span> LYNOX <span class="tag-bracket">✧</span></div>
      <div class="tag">// ربط بوت فرعي عن طريق الموقع</div>

      <label for="numInput">رقم الهاتف (مع كود الدولة)</label>
      <input type="text" id="numInput" placeholder="مثال: 201096359337" inputmode="numeric" autocomplete="off">

      <button id="pairBtn">🔑 احصل على كود الربط</button>
      <div class="hint">اكتب الرقم بكود الدولة من غير + أو مسافات</div>

      <button class="dev-btn" id="devBtn">👨‍💻 صفحة المطور</button>

      <div class="spinner" id="spinner"></div>
      <div class="error" id="errorBox"></div>

      <div class="result" id="resultBox">
        <div class="terminal glass">
          <div class="terminal-head">
            <span class="dot r"></span>
            <span class="dot y"></span>
            <span class="dot g"></span>
            <span class="terminal-title">lynox@pair — code</span>
          </div>
          <div class="terminal-body">
            <div class="code-text" id="codeText"></div>
          </div>
        </div>
        <button class="copy-btn" id="copyBtn">📋 نسخ الكود</button>
        <div class="steps">
          <b>❶</b> افتح الواتساب على نفس الرقم اللي كتبته<br>
          <b>❷</b> ادخل على القائمة (الثلاث نقاط)<br>
          <b>❸</b> اختر "الأجهزة المرتبطة"<br>
          <b>❹</b> اضغط على "ربط بجهاز" ثم "الربط برقم الهاتف"<br>
          <b>❺</b> أدخل الكود اللي فوق
        </div>
      </div>

      <footer><span class="tag-bracket">console.log(</span>'✧ LYNOX SYSTEM ✧'<span class="tag-bracket">)</span></footer>
    </div>
  </main>

<script>
const numInput = document.getElementById('numInput');
const pairBtn = document.getElementById('pairBtn');
const devBtn = document.getElementById('devBtn');
const spinner = document.getElementById('spinner');
const errorBox = document.getElementById('errorBox');
const resultBox = document.getElementById('resultBox');
const codeText = document.getElementById('codeText');
const copyBtn = document.getElementById('copyBtn');

devBtn.addEventListener('click', () => {
  window.location.href = 'https://lynox.duckdns.org/';
});

function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.add('show');
}
function hideError() {
  errorBox.classList.remove('show');
}

pairBtn.addEventListener('click', async () => {
  hideError();
  resultBox.classList.remove('show');
  const number = numInput.value.trim();
  if (!number) { showError('اكتب رقم الهاتف الأول'); return; }

  pairBtn.disabled = true;
  spinner.classList.add('show');

  try {
    const res = await fetch('/api/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number })
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'حصل خطأ، حاول تاني');
    } else {
      codeText.textContent = data.code;
      resultBox.classList.add('show');
    }
  } catch (e) {
    showError('فشل الاتصال بالسيرفر');
  } finally {
    pairBtn.disabled = false;
    spinner.classList.remove('show');
  }
});

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(codeText.textContent).then(() => {
    copyBtn.textContent = '✅ تم النسخ';
    setTimeout(() => { copyBtn.textContent = '📋 نسخ الكود'; }, 1500);
  });
});
</script>
</body>
</html>`

async function handlePairRequest(req, res) {
    let responded = false
    let timeout = null
    let onPair, onError

    const cleanup = (sub) => {
        if (!sub) return
        if (onPair) sub.off('pair', onPair)
        if (onError) sub.off('error', onError)
    }

    try {
        const raw = await readBody(req)
        let body = {}
        try {
            body = JSON.parse(raw || '{}')
        } catch {
            return sendJSON(res, 400, { error: 'بيانات غير صالحة' })
        }

        const number = extractNumber(body.number)
        if (!number || number.length < 7) {
            return sendJSON(res, 400, { error: 'رقم الهاتف غير صحيح' })
        }

        // نفس فحص الإغلاق المستخدم في أمر .تنصيب (plugins/subs/sub.js)
        if (global.db?.noSub) {
            return sendJSON(res, 403, { error: 'نظام البوتات الفرعية معطل حالياً من المطور' })
        }

        const sub = global.subBots
        if (!sub) {
            return sendJSON(res, 503, { error: 'نظام البوتات الفرعية لسه مش جاهز، حاول تاني بعد شوية' })
        }

        const state = { uid: null, pairDone: false, pending: null }

        const finish = (status, obj) => {
            if (responded) return
            responded = true
            if (timeout) clearTimeout(timeout)
            cleanup(sub)
            sendJSON(res, status, obj)
        }

        onPair = (id, code) => {
            if (!state.uid) { state.pending = { id, code }; return }
            if (id !== state.uid || state.pairDone) return
            state.pairDone = true
            finish(200, { code, number })
        }

        onError = (id, err) => {
            if (state.uid && id !== state.uid) return
            finish(500, { error: err?.message || 'فشل الاقتران' })
        }

        sub.on('pair', onPair)
        sub.on('error', onError)

        timeout = setTimeout(() => {
            finish(504, { error: 'انتهت مهلة الاتصال، حاول مرة أخرى' })
        }, PAIR_TIMEOUT_MS)

        // sub.add() هو نفسه اللي أمر .تنصيب بيستخدمه (plugins/subs/sub.js)
        // بيرجع uid وبيبعت كود الربط عن طريق حدث 'pair'
        state.uid = await sub.add(number)

        if (state.pending?.id === state.uid && !state.pairDone) {
            state.pairDone = true
            finish(200, { code: state.pending.code, number })
        }

    } catch (e) {
        console.error('[web-pair] error:', e)
        cleanup(global.subBots)
        if (!res.headersSent) sendJSON(res, 500, { error: e?.message || 'حدث خطأ غير متوقع' })
    }
}

export default function startServer(port) {
    const server = http.createServer(async (req, res) => {
        try {
            if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
                return res.end(PAGE_HTML)
            }
            if (req.method === 'POST' && req.url === '/api/pair') {
                return handlePairRequest(req, res)
            }
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            res.end('404 - الصفحة غير موجودة')
        } catch (e) {
            console.error('[server] error:', e)
            if (!res.headersSent) {
                res.writeHead(500)
                res.end('500 - خطأ في السيرفر')
            }
        }
    })

    const listenPort = port || FIXED_PORT
    server.listen(listenPort, '0.0.0.0', () => {
        console.log(`🌐 موقع تنصيب البوتات الفرعية شغال على المنفذ ${listenPort}`)
        console.log(`🔗 الدومين: ${DOMAIN}:${listenPort}`)
    })

    server.on('error', (e) => {
        console.error('[web-pair-server] فشل تشغيل السيرفر:', e.message)
    })

    return server
}