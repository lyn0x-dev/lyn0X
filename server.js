// server.js
// ✧ URANOS SYSTEM ✧ - موقع تنصيب البوتات الفرعية 🌐
// نسخة متوافقة مع نظام السب بوت الحالي (meowsab / global.subBots)
// ملحوظة مهمة: لازم يشتغل جوا نفس البروسيس بتاع البوت الأساسي (مش سبون لبروسيس منفصل)
// عشان يقدر يوصل لـ global.subBots. عشان كده بيتشغل تلقائي من index.js.

import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOMAIN = 'http://lynox.kdns.fr:20204'
// منصة Katabump (زي HidenCloud) بيوت Pterodactyl، فالبورت بيتحدد من "Allocations" في البانل
// مش من الكود؛ خليه بياخد قيمته من متغير البيئة SERVER_PORT أو PORT اللي البانل بيحطه تلقائي
const FIXED_PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000)
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
<title>✧ URANOS - ربط بوت فرعي ✧</title>
<meta property="og:title" content="✧ URANOS SYSTEM ✧">
<meta property="og:description" content="ربط بوت فرعي عن طريق الموقع">
<meta property="og:image" content="https://files.catbox.moe/amyy67.jpg">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://files.catbox.moe/amyy67.jpg">
<meta name="theme-color" content="#0b0e1a">
<style>
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body {
    margin: 0; padding: 0; min-height: 100vh;
    background: linear-gradient(160deg, #0d1120 0%, #131a2e 40%, #0a0e1a 100%);
    font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
    color: #e2e6f5;
    display: flex; align-items: center; justify-content: center;
    padding: 28px 14px;
  }
  body::before {
    content: '';
    position: fixed; inset: 0;
    background:
      radial-gradient(circle at 15% 15%, rgba(110,130,220,0.15), transparent 40%),
      radial-gradient(circle at 85% 80%, rgba(90,70,160,0.18), transparent 45%);
    pointer-events: none;
  }
  .card {
    position: relative; z-index: 1;
    width: 100%; max-width: 420px;
    background: rgba(30,36,60,0.45);
    border: 1px solid rgba(150,165,220,0.18);
    border-radius: 26px;
    padding: 30px 24px;
    box-shadow: 0 15px 45px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05);
    backdrop-filter: blur(18px) saturate(140%);
    -webkit-backdrop-filter: blur(18px) saturate(140%);
  }
  .logo {
    text-align: center; font-size: 24px; font-weight: 800;
    color: #c6cff0; letter-spacing: 3px; margin-bottom: 2px;
  }
  .tag {
    text-align: center; font-size: 12px; color: #8b93b8; margin-bottom: 22px;
  }
  label { font-size: 13px; color: #b3bbdc; display: block; margin-bottom: 8px; font-weight: 600; }
  input[type=text] {
    width: 100%; padding: 14px 16px; border-radius: 14px;
    border: 1px solid rgba(150,165,220,0.25);
    background: rgba(10,13,25,0.5); color: #e2e6f5; font-size: 16px;
    outline: none; direction: ltr; text-align: center; letter-spacing: 1px;
    backdrop-filter: blur(6px);
  }
  input[type=text]:focus { border-color: #7c93c4; box-shadow: 0 0 0 3px rgba(124,147,196,0.25); }
  button {
    width: 100%; margin-top: 16px; padding: 14px; border: none; border-radius: 14px;
    background: linear-gradient(135deg, rgba(90,100,160,0.5), rgba(60,70,120,0.35));
    border: 1px solid rgba(150,165,220,0.25);
    color: #e2e6f5; font-size: 15px; font-weight: 700; cursor: pointer;
    backdrop-filter: blur(8px);
    transition: transform .15s, opacity .15s, box-shadow .15s;
    box-shadow: 0 6px 18px rgba(0,0,0,0.35);
  }
  button:active { transform: scale(0.97); }
  button:disabled { opacity: 0.55; cursor: not-allowed; }
  .dev-btn {
    background: linear-gradient(135deg, rgba(70,80,140,0.5), rgba(50,60,110,0.3));
    color: #c6cff0; margin-top: 10px;
  }
  .hint { font-size: 11px; color: #8b93b8; text-align: center; margin-top: 10px; }
  .result { margin-top: 22px; text-align: center; display: none; }
  .result.show { display: block; }
  .code-box {
    font-size: 28px; font-weight: 800; letter-spacing: 4px;
    background: rgba(10,13,25,0.55); border: 1px dashed rgba(150,165,220,0.4);
    border-radius: 16px; padding: 16px; color: #9ab4ff; direction: ltr;
    user-select: all; backdrop-filter: blur(6px);
  }
  .copy-btn {
    margin-top: 10px; background: rgba(255,255,255,0.06); color: #b3bbdc;
    font-size: 13px; padding: 10px; box-shadow: none;
  }
  .steps { text-align: right; font-size: 13px; color: #c2c9e8; margin-top: 18px; line-height: 2; }
  .error {
    margin-top: 16px; background: rgba(60,20,30,0.4); border: 1px solid rgba(220,90,110,0.4);
    color: #ff9fae; padding: 10px 14px; border-radius: 12px; font-size: 13px; text-align: center;
    display: none; backdrop-filter: blur(6px);
  }
  .error.show { display: block; }
  .spinner {
    display: none; width: 22px; height: 22px; margin: 14px auto 0;
    border: 3px solid rgba(150,165,220,0.2); border-top-color: #7c93c4;
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  .spinner.show { display: block; }
  @keyframes spin { to { transform: rotate(360deg); } }
  footer { text-align: center; font-size: 11px; color: #6c7599; margin-top: 22px; }
</style>
</head>
<body>
  <div class="card">
    <div class="logo">✧ URANOS ✧</div>
    <div class="tag">ربط بوت فرعي عن طريق الموقع</div>

    <label for="numInput">رقم الهاتف (مع كود الدولة)</label>
    <input type="text" id="numInput" placeholder="مثال: 201096359337" inputmode="numeric" autocomplete="off">

    <button id="pairBtn">🔑 احصل على كود الربط</button>
    <div class="hint">اكتب الرقم بكود الدولة من غير + أو مسافات</div>

    <button class="dev-btn" id="devBtn">👨‍💻 صفحة المطور</button>

    <div class="spinner" id="spinner"></div>
    <div class="error" id="errorBox"></div>

    <div class="result" id="resultBox">
      <div class="code-box" id="codeText"></div>
      <button class="copy-btn" id="copyBtn">📋 نسخ الكود</button>
      <div class="steps">
        ❶ افتح الواتساب على نفس الرقم اللي كتبته<br>
        ❷ ادخل على القائمة (الثلاث نقاط)<br>
        ❸ اختر "الأجهزة المرتبطة"<br>
        ❹ اضغط على "ربط بجهاز" ثم "الربط برقم الهاتف"<br>
        ❺ أدخل الكود اللي فوق
      </div>
    </div>

    <footer>✧ URANOS SYSTEM ✧</footer>
  </div>

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
        console.log(`🔗 الدومين: ${DOMAIN}`)
    })

    server.on('error', (e) => {
        console.error('[web-pair-server] فشل تشغيل السيرفر:', e.message)
    })

    return server
}