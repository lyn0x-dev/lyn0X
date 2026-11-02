// telegram/admin.js
// ✧ بوت تيليجرام: تنصيب بوتات فرعية + لوحة تحكم المالك ✧
// نفس فكرة نظام التنصيب عبر تيليجرام + لوحة إدارة (مسح الجلسات / الداتابيز / ريستارت / نسخة احتياطية / إذاعة)

import TelegramBot from 'node-telegram-bot-api'
import PhoneNumber from 'awesome-phonenumber'
import archiver from 'archiver'
import fs from 'fs'
import path from 'path'

// ═══════════════════════════════════════
// ✧ المالك ✧
// ═══════════════════════════════════════

const OWNER_ID = String(global.telegramOwnerID ?? 0)

if (!global.telegramOwnerID) {
    console.log('⚠️ لم تقم بتحديد global.telegramOwnerID في index.js — أوامر لوحة التحكم (مسح الجلسات/الداتابيز/ريستارت/إذاعة/نسخة احتياطية/حذف بوت) لن تعمل لحد ما تحطه.')
}

const isOwner = (from) => !!from && !!global.telegramOwnerID && String(from.id) === OWNER_ID

// ═══════════════════════════════════════
// ✧ الحالة العامة ✧
// ═══════════════════════════════════════

const waitingForNumber = new Map()     // chatId -> true (بانتظار رقم التنصيب)
const waitTimers = new Map()
const installing = new Set()
const loadingMessages = new Map()

const waitingForBroadcast = new Map()  // chatId -> true
const broadcastWaitTimers = new Map()
const pendingBroadcast = new Map()     // chatId -> { text }
const broadcastInProgress = new Set()
const backupInProgress = new Set()

const WAIT_TIMEOUT = 2 * 60 * 1000

let botInstance = null

const esc = (s) => String(s ?? '').replace(/[_*`\[]/g, '\\$&')

function extractNumber(input) {
    const cleaned = String(input || '').replace(/\s+/g, '').replace(/^\+/, '')
    const match = cleaned.match(/\d+/)
    return match ? match[0] : ''
}

function parsePhone(number) {
    try {
        const pn = PhoneNumber('+' + number)
        return {
            valid: pn.isValid(),
            international: pn.isValid() ? pn.getNumber('international') : '+' + number,
            region: pn.getRegionCode?.() || null
        }
    } catch {
        return { valid: false, international: '+' + number, region: null }
    }
}

function flagOf(region) {
    if (!region || region.length !== 2) return '🌐'
    return String.fromCodePoint(...[...region.toUpperCase()].map(c => 127397 + c.charCodeAt(0)))
}

const rmrf = (p) => {
    try { fs.rmSync(p, { recursive: true, force: true }) } catch {}
}

// ═══════════════════════════════════════
// ✧ أدوات إدارة النظام ✧
// ═══════════════════════════════════════

// ✧ مسح كل الجلسات: بيانات الاعتماد بتاعة البوت الرئيسي وكل السب بوتات
// (مخزنة كلها في نفس الاستوريدج LevelDB جوا مجلد ./sub) ✧
async function clearAllSessions() {
    try {
        if (global.subBots?.stopAll) await global.subBots.stopAll()
    } catch {}
    let removed = false
    if (fs.existsSync('./sub')) {
        rmrf('./sub')
        removed = true
    }
    return removed
}

// ✧ مسح قاعدة البيانات (UltraDB) بالكامل: المجموعات + المستخدمين ✧
function clearDatabaseAll() {
    if (!global.db) return
    try {
        const groups = global.db.groups
        for (const k of Object.keys(groups)) delete groups[k]
    } catch {}
    try {
        const users = global.db.users
        for (const k of Object.keys(users)) delete users[k]
    } catch {}
}

// ✧ نسخة احتياطية: كود المشروع + قاعدة البيانات، من غير جلسات الواتساب (حماية للأرقام) ✧
async function makeBackupZip() {
    const zipPath = path.join('./', `backup-${Date.now()}.zip`)
    await new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath)
        const archive = archiver('zip', { zlib: { level: 9 } })
        output.on('close', resolve)
        archive.on('error', reject)
        archive.pipe(output)
        archive.glob('**/*', {
            cwd: process.cwd(),
            dot: false,
            ignore: [
                'node_modules/**',
                '.git/**',
                'sub/**',
                'tmp/**',
                '*.zip'
            ]
        })
        archive.finalize()
    })
    return zipPath
}

// ✧ إذاعة رسالة نصية لكل المستخدمين المسجلين في قاعدة البيانات ✧
function getBroadcastTargets() {
    const users = global.db?.users || {}
    return Object.keys(users).filter((jid) => jid.endsWith('@s.whatsapp.net'))
}

async function broadcastToUsers(text, onProgress) {
    const sock = global.client?.sock
    if (!sock) throw new Error('البوت الرئيسي مش متصل دلوقتي')
    const targets = getBroadcastTargets()
    let sent = 0
    let failed = 0
    for (const jid of targets) {
        try {
            await sock.sendMessage(jid, { text })
            sent++
        } catch {
            failed++
        }
        if (onProgress && (sent + failed) % 20 === 0) {
            try { await onProgress(sent, failed, targets.length) } catch {}
        }
        await new Promise((res) => setTimeout(res, 1200))
    }
    return { sent, failed, total: targets.length }
}

// ═══════════════════════════════════════
// ✧ تصميم الرسائل ✧
// ═══════════════════════════════════════

const BANNER =
    '✧━━━━━━━━━━━━━━━━✧\n' +
    '       𝑳𝒚𝒏𝒐𝑿\n' +
    '✧━━━━━━━━━━━━━━━━✧'

const welcomeText = () =>
    BANNER + '\n\n' +
    '╭─❖ 🤖 *بوت التنصيب*\n' +
    '│\n' +
    '├ 👋 أهلاً فيك!\n' +
    '├ من هنا تقدر تنصّب بوت فرعي\n' +
    '├ على أي رقم واتساب بسهولة\n' +
    '│\n' +
    '╰─────────────────❖\n\n' +
    '👇 *اضغط الزر تحت عشان تبدأ*'

const askNumberText =
    '╭─❖ 📱 *أرسل رقم الواتساب*\n' +
    '│\n' +
    '├ ✍️ اكتب الرقم *مع كود الدولة*\n' +
    '├ ⚠️ بدون + أو مسافات أو رموز\n' +
    '│\n' +
    '├ 📌 *مثال:*\n' +
    '╰─▶ `201012345678`'

const invalidText =
    '╭─❖ ❌ *الرقم غير صحيح*\n' +
    '│\n' +
    '├ 🤔 الرقم اللي بعته مش مظبوط\n' +
    '├ تأكد إنه كامل ومعاه كود الدولة\n' +
    '╰─────────────────❖'

const cancelText =
    '╭─❖ ❌ *تم الإلغاء*\n' +
    '│\n' +
    '├ ما تم تنصيب أي شيء\n' +
    '╰─────────────────❖'

const timeoutText =
    '╭─❖ ⌛ *انتهت مدة الانتظار*\n' +
    '│\n' +
    '├ ابعت /تنصيب عشان تبدأ من جديد\n' +
    '╰─────────────────❖'

const busyText = '⏳ *في عملية تنصيب شغالة حالياً*\nاستنى لحد ما تخلص الأول 🙏'

const loadingText = (info) =>
    '╭─❖ ⏳ *جاري إنشاء كود الربط...*\n' +
    '│\n' +
    `├ 📞 الرقم: ${info.international}\n` +
    `├ 🌍 الدولة: ${flagOf(info.region)} \`${info.region || '؟'}\`\n` +
    '│\n' +
    '├ 🙏 ثواني ويكون جاهز...\n' +
    '╰─────────────────❖'

const codeText = (code, num) =>
    '╭─❖ 🔑 *كود الربط جاهز!*\n' +
    '│\n' +
    `├ 📞 الرقم: ${num}\n` +
    '│\n' +
    '├ 🔐 *كود الربط:*\n' +
    `╰─▶ \`${code}\`\n\n` +
    '🎯 *الخطوات:*\n' +
    '❶ افتح واتساب على الرقم\n' +
    '❷ القائمة ⋮ ← الأجهزة المرتبطة\n' +
    '❸ اضغط «ربط برقم الهاتف»\n' +
    '❹ أدخل الكود اللي فوق\n\n' +
    '⏱️ *الكود صالح لفترة قصيرة، أسرع!*'

const successText = (num) =>
    '╭─❖ 🎉 *تم التنصيب بنجاح!*\n' +
    '│\n' +
    '├ ✅ البوت الفرعي اشتغل بنجاح\n' +
    `├ 📞 الرقم: ${num}\n` +
    '╰─────────────────❖'

const errorText = (msg) =>
    '╭─❖ ⚠️ *حصل خطأ!*\n' +
    '│\n' +
    `├ ${esc(msg || 'صار خطأ أثناء التنصيب 😔')}\n` +
    '╰─────────────────❖'

const notOwnerText = '⛔ *هذا الأمر مخصص للمالك فقط*'

const helpText =
    'ℹ️ *طريقة التنصيب*\n\n' +
    '1️⃣ اضغط "ابدأ التنصيب"\n' +
    '2️⃣ ابعت رقم الواتساب بكود الدولة (من غير + أو مسافات)\n' +
    '3️⃣ هيوصلك كود ربط، افتحه في واتساب من الأجهزة المرتبطة\n' +
    '4️⃣ لما يتم الربط هيوصلك تأكيد'

// ✧ لوحة إدارة النظام ✧
const systemMenuText =
    '╭─❖ ⚙️ *إدارة النظام*\n' +
    '│\n' +
    '├ 🔒 لوحة تحكم خاصة بالمالك فقط\n' +
    '├ اختار العملية اللي عايزها\n' +
    '╰─────────────────❖'

const CONFIRM_LABELS = {
    clear_sessions: {
        title: '🗑️ مسح كل الجلسات',
        lines: [
            'هيتفصل البوت الرئيسي وكل السب بوتات',
            'ولازم تعمل ربط (كود) من جديد بعدها'
        ]
    },
    clear_db: {
        title: '🧹 مسح قاعدة البيانات',
        lines: ['هيتمسح كل بيانات المستخدمين والمجموعات نهائياً']
    },
    restart: {
        title: '🔄 إعادة تشغيل البوت',
        lines: ['هيتقفل البوت دلوقتي ويرجع يشتغل تاني تلقائياً']
    }
}

const confirmText = (action) => {
    const c = CONFIRM_LABELS[action]
    if (!c) return ''
    return (
        '╭─❖ ⚠️ *تأكيد العملية*\n│\n' +
        `├ ${c.title}\n│\n` +
        c.lines.map((l) => `├ ${l}`).join('\n') + '\n│\n' +
        '├ ⚠️ العملية دي *لا يمكن التراجع عنها*\n' +
        '╰─────────────────❖'
    )
}

const confirmKeyboard = (action) => ({
    inline_keyboard: [
        [{ text: '✅ نعم، متأكد', callback_data: `do_${action}` }],
        [{ text: '❌ إلغاء', callback_data: 'system_menu' }]
    ]
})

const askBroadcastText =
    '╭─❖ 📢 *إذاعة رسالة*\n' +
    '│\n' +
    '├ ✍️ ابعت الرسالة اللي عايز تبعتها\n' +
    '├ هتوصل لكل المستخدمين المسجلين في قاعدة البيانات\n' +
    '│\n' +
    '├ ⚠️ نص فقط حالياً\n' +
    '╰─────────────────❖'

const broadcastConfirmText = (text, count) =>
    '╭─❖ 📢 *تأكيد الإذاعة*\n│\n' +
    `├ 👥 عدد المستقبلين: *${count}*\n│\n` +
    '├ 📝 نص الرسالة:\n' +
    `╰─▶ ${text.length > 300 ? text.slice(0, 300) + '…' : text}`

const broadcastConfirmKeyboard = {
    inline_keyboard: [
        [{ text: '✅ ابدأ الإرسال', callback_data: 'confirm_broadcast_send' }],
        [{ text: '❌ إلغاء', callback_data: 'system_menu' }]
    ]
}

// ✧ لوحات الأزرار ✧

const mainMenuKeyboardFor = (from) => {
    const kb = {
        inline_keyboard: [
            [{ text: '🚀 ابدأ التنصيب', callback_data: 'start_install' }],
            [{ text: '❔ مساعدة', callback_data: 'help_install' }]
        ]
    }
    if (isOwner(from)) {
        kb.inline_keyboard.push([{ text: '🤖 البوتات الفرعية', callback_data: 'list_bots' }])
        kb.inline_keyboard.push([{ text: '⚙️ إدارة النظام', callback_data: 'system_menu' }])
    }
    return kb
}

const successKeyboardFor = (from) => {
    const kb = {
        inline_keyboard: [
            [{ text: '➕ تنصيب رقم تاني', callback_data: 'start_install' }]
        ]
    }
    if (isOwner(from)) {
        kb.inline_keyboard.push([{ text: '🤖 البوتات الفرعية', callback_data: 'list_bots' }])
    }
    kb.inline_keyboard.push([{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }])
    return kb
}

const cancelKeyboard = { inline_keyboard: [[{ text: '❌ إلغاء', callback_data: 'cancel_install' }]] }
const backKeyboard = { inline_keyboard: [[{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]] }
const systemBackKeyboard = { inline_keyboard: [[{ text: '⚙️ إدارة النظام', callback_data: 'system_menu' }]] }
const retryKeyboard = {
    inline_keyboard: [
        [{ text: '🔁 حاول مرة ثانية', callback_data: 'start_install' }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
    ]
}

const botsListKeyboard = {
    inline_keyboard: [
        [{ text: '🔄 تحديث', callback_data: 'list_bots' }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
    ]
}

const systemMenuKeyboard = {
    inline_keyboard: [
        [{ text: '🗑️ مسح كل الجلسات', callback_data: 'confirm_clear_sessions' }],
        [{ text: '🧹 مسح قاعدة البيانات', callback_data: 'confirm_clear_db' }],
        [{ text: '🔄 إعادة تشغيل البوت', callback_data: 'confirm_restart' }],
        [{ text: '📦 نسخة احتياطية', callback_data: 'do_backup' }],
        [{ text: '📢 إذاعة رسالة للمستخدمين', callback_data: 'start_broadcast' }],
        [{ text: '🏠 القائمة الرئيسية', callback_data: 'main_menu' }]
    ]
}

// ═══════════════════════════════════════
// ✧ التشغيل ✧
// ═══════════════════════════════════════

export function startTelegramAdmin() {
    if (!global.telegramAdminEnabled) {
        console.log('⚠️ بوت تيليجرام معطل (global.telegramAdminEnabled = false)')
        return null
    }

    const token = global.telegramAdminToken
    if (!token) {
        console.log('⚠️ لا يوجد توكن تيليجرام (global.telegramAdminToken)، لن يتم تشغيل بوت تيليجرام')
        return null
    }

    let bot
    try {
        bot = new TelegramBot(token, { polling: true })
    } catch (e) {
        console.error('❌ فشل تشغيل بوت تيليجرام:', e)
        return null
    }
    botInstance = bot

    bot.on('polling_error', (err) => {
        console.error('❌ Telegram polling error:', err?.message || err)
    })

    bot.getMe()
        .then((me) => console.log(`✅ بوت تيليجرام يعمل الآن (@${me.username})`))
        .catch(() => console.log('✅ بوت تيليجرام يعمل الآن'))

    const clearWait = (chatId) => {
        const t = waitTimers.get(chatId)
        if (t) clearTimeout(t)
        waitTimers.delete(chatId)
        waitingForNumber.delete(chatId)
    }

    const editSafe = async (chatId, msgId, text, opts) => {
        try {
            await bot.editMessageText(text, { chat_id: chatId, message_id: msgId, ...opts })
            return true
        } catch (e) {
            if (String(e?.message || '').includes('message is not modified')) return true
            return false
        }
    }

    const sendWelcome = (chatId, from) =>
        bot.sendMessage(chatId, welcomeText(), { parse_mode: 'Markdown', reply_markup: mainMenuKeyboardFor(from) })

    const askForNumber = async (chatId) => {
        clearWait(chatId)
        waitingForNumber.set(chatId, true)
        waitTimers.set(chatId, setTimeout(async () => {
            if (waitingForNumber.delete(chatId)) {
                waitTimers.delete(chatId)
                await bot.sendMessage(chatId, timeoutText, { parse_mode: 'Markdown' }).catch(() => {})
            }
        }, WAIT_TIMEOUT))
        await bot.sendMessage(chatId, askNumberText, { parse_mode: 'Markdown', reply_markup: cancelKeyboard })
    }

    // ═══ لوحة البوتات الفرعية (للمالك فقط) ═══
    const sendBotsList = async (chatId, msgId = null) => {
        const sub = global.subBots
        const bots = sub ? sub.list() : []
        const stats = sub ? sub.stats() : { total: 0, connected: 0, disconnected: 0, totalMessages: 0 }

        let text
        if (!bots.length) {
            text =
                '╭─❖ 📭 *لا توجد بوتات فرعية*\n│\n├ لسه مفيش أي بوت منصّب\n╰─────────────────❖'
        } else {
            text =
                '╭─❖ 🤖 *البوتات الفرعية المنصبة*\n' +
                `├ 📊 الإجمالي: *${stats.total}*  •  🟢 متصل: *${stats.connected}*  •  🔴 غير متصل: *${stats.disconnected}*\n` +
                '╰─────────────────❖\n\n'
            text += bots.map((b, i) => (
                `┏ ${b.connected ? '🟢' : '🔴'} *${i + 1}.* 📞 ${b.phone || '—'}\n` +
                `┃ 👤 ${esc(b.name || 'غير معروف')}\n` +
                `┃ 📨 الرسائل: ${b.messages || 0}\n` +
                `┃ 🆔 \`${b.id}\`\n` +
                `┗ ─────────────────`
            )).join('\n')
        }

        const opts = { parse_mode: 'Markdown', reply_markup: botsListKeyboard }
        if (msgId) {
            const ok = await editSafe(chatId, msgId, text, opts)
            if (!ok) await bot.sendMessage(chatId, text, opts).catch(() => {})
        } else {
            await bot.sendMessage(chatId, text, opts).catch(() => {})
        }
    }

    // ✧ الأوامر ✧
    bot.onText(/^\/start(@\w+)?/i, (msg) => sendWelcome(msg.chat.id, msg.from))
    bot.onText(/^\/cancel(@\w+)?/i, (msg) => {
        clearWait(msg.chat.id)
        bot.sendMessage(msg.chat.id, cancelText, { parse_mode: 'Markdown', reply_markup: backKeyboard })
    })
    bot.onText(/^\/(تنصيب|install)(@\w+)?/i, (msg) => askForNumber(msg.chat.id))

    bot.onText(/^\/(bots|subbots|بوتات|البوتات)(@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id
        if (!isOwner(msg.from)) return bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {})
        await bot.sendChatAction(chatId, 'typing').catch(() => {})
        await sendBotsList(chatId)
    })

    bot.onText(/^\/(system|النظام|الادارة|الإدارة)(@\w+)?$/i, async (msg) => {
        const chatId = msg.chat.id
        if (!isOwner(msg.from)) return bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {})
        await bot.sendMessage(chatId, systemMenuText, { parse_mode: 'Markdown', reply_markup: systemMenuKeyboard }).catch(() => {})
    })

    // ✧ تنفيذ التنصيب (مشترك بين الأمر والزرار) ✧
    const runInstall = async (chatId, number, fromUser) => {
        const info = parsePhone(number)
        installing.add(chatId)
        setTimeout(() => installing.delete(chatId), 5 * 60 * 1000)

        await bot.sendChatAction(chatId, 'typing').catch(() => {})
        const loadingMsg = await bot.sendMessage(chatId, loadingText(info), { parse_mode: 'Markdown' })
        loadingMessages.set(chatId, loadingMsg.message_id)

        const sub = global.subBots
        if (!sub) {
            installing.delete(chatId)
            return bot.sendMessage(chatId, errorText('نظام البوتات الفرعية غير متاح دلوقتي'), { parse_mode: 'Markdown', reply_markup: retryKeyboard })
        }
        if (global.db?.noSub) {
            installing.delete(chatId)
            return bot.sendMessage(chatId, errorText('المطور قافل التنصيب دلوقتي'), { parse_mode: 'Markdown', reply_markup: retryKeyboard })
        }

        const state = { uid: null, pairDone: false, resolved: false, pending: null }
        const cleanup = () => {
            sub.off('pair', handlers.pair)
            sub.off('ready', handlers.ready)
            sub.off('error', handlers.error)
        }
        const handlers = {
            pair: async (id, code) => {
                if (state.pairDone) return
                if (!state.uid) { state.pending = { id, code }; return }
                if (id !== state.uid) return
                state.pairDone = true
                const body = codeText(code, info.international)
                const oldMsgId = loadingMessages.get(chatId)
                loadingMessages.delete(chatId)
                if (oldMsgId) {
                    const edited = await editSafe(chatId, oldMsgId, body, { parse_mode: 'Markdown' })
                    if (edited) return
                }
                await bot.sendMessage(chatId, body, { parse_mode: 'Markdown' })
            },
            ready: async (id) => {
                if (id !== state.uid || state.resolved) return
                state.resolved = true
                installing.delete(chatId)
                await bot.sendMessage(chatId, successText(info.international), { parse_mode: 'Markdown', reply_markup: successKeyboardFor(fromUser) }).catch(() => {})
                cleanup()
            },
            error: async (id, err) => {
                if (id !== state.uid || state.resolved) return
                state.resolved = true
                installing.delete(chatId)
                await bot.sendMessage(chatId, errorText(err?.message), { parse_mode: 'Markdown', reply_markup: retryKeyboard }).catch(() => {})
                cleanup()
            }
        }
        sub.on('pair', handlers.pair)
        sub.on('ready', handlers.ready)
        sub.on('error', handlers.error)

        try {
            state.uid = await sub.add(number)
            if (state.pending?.id === state.uid && !state.pairDone) {
                await handlers.pair(state.uid, state.pending.code)
            }
            setTimeout(() => {
                if (state.resolved) return
                state.resolved = true
                installing.delete(chatId)
                cleanup()
            }, 120000)
        } catch (e) {
            installing.delete(chatId)
            cleanup()
            await bot.sendMessage(chatId, errorText(e?.message), { parse_mode: 'Markdown', reply_markup: retryKeyboard }).catch(() => {})
        }
    }

    // ✧ ضغطات الأزرار ✧
    bot.on('callback_query', async (query) => {
        const chatId = query.message?.chat?.id
        if (!chatId) return
        const msgId = query.message?.message_id

        switch (query.data) {
            case 'start_install':
                if (installing.has(chatId)) await bot.sendMessage(chatId, busyText, { parse_mode: 'Markdown' }).catch(() => {})
                else await askForNumber(chatId)
                break

            case 'help_install': {
                const ok = msgId ? await editSafe(chatId, msgId, helpText, { parse_mode: 'Markdown', reply_markup: backKeyboard }) : false
                if (!ok) await bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown', reply_markup: backKeyboard }).catch(() => {})
                break
            }

            case 'main_menu': {
                const ok = msgId ? await editSafe(chatId, msgId, welcomeText(), { parse_mode: 'Markdown', reply_markup: mainMenuKeyboardFor(query.from) }) : false
                if (!ok) sendWelcome(chatId, query.from)
                break
            }

            case 'list_bots':
                if (!isOwner(query.from)) await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {})
                else await sendBotsList(chatId, msgId)
                break

            case 'cancel_install':
                clearWait(chatId)
                if (msgId) {
                    const ok = await editSafe(chatId, msgId, cancelText, { parse_mode: 'Markdown', reply_markup: backKeyboard })
                    if (!ok) await bot.sendMessage(chatId, cancelText, { parse_mode: 'Markdown', reply_markup: backKeyboard }).catch(() => {})
                }
                break

            // ═══ لوحة إدارة النظام (للمالك فقط) ═══
            case 'system_menu':
                if (!isOwner(query.from)) {
                    await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {})
                } else {
                    const ok = msgId ? await editSafe(chatId, msgId, systemMenuText, { parse_mode: 'Markdown', reply_markup: systemMenuKeyboard }) : false
                    if (!ok) await bot.sendMessage(chatId, systemMenuText, { parse_mode: 'Markdown', reply_markup: systemMenuKeyboard }).catch(() => {})
                }
                break

            case 'confirm_clear_sessions':
            case 'confirm_clear_db':
            case 'confirm_restart': {
                if (!isOwner(query.from)) { await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {}); break }
                const action = query.data.replace('confirm_', '')
                const ok = msgId ? await editSafe(chatId, msgId, confirmText(action), { parse_mode: 'Markdown', reply_markup: confirmKeyboard(action) }) : false
                if (!ok) await bot.sendMessage(chatId, confirmText(action), { parse_mode: 'Markdown', reply_markup: confirmKeyboard(action) }).catch(() => {})
                break
            }

            case 'do_clear_sessions': {
                if (!isOwner(query.from)) { await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {}); break }
                await bot.sendChatAction(chatId, 'typing').catch(() => {})
                const removed = await clearAllSessions()
                await bot.sendMessage(chatId,
                    '╭─❖ ✅ *تم مسح الجلسات*\n│\n' +
                    (removed ? '├ 🗑️ اتمسحت كل الجلسات (الرئيسي + السب بوتات)' : '├ محدش لقيت أي جلسة') +
                    '\n│\n├ ⚠️ لازم دلوقتي تعمل ريستارت وتربط تاني\n╰─────────────────❖',
                    { parse_mode: 'Markdown', reply_markup: systemBackKeyboard }
                ).catch(() => {})
                break
            }

            case 'do_clear_db': {
                if (!isOwner(query.from)) { await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {}); break }
                await bot.sendChatAction(chatId, 'typing').catch(() => {})
                clearDatabaseAll()
                await bot.sendMessage(chatId, '✅ *تم مسح قاعدة البيانات بالكامل*', { parse_mode: 'Markdown', reply_markup: systemBackKeyboard }).catch(() => {})
                break
            }

            case 'do_restart': {
                if (!isOwner(query.from)) { await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {}); break }
                await bot.sendMessage(chatId, '🔄 *جاري إعادة تشغيل البوت...*', { parse_mode: 'Markdown' }).catch(() => {})
                setTimeout(() => process.exit(1), 1500)
                break
            }

            case 'do_backup': {
                if (!isOwner(query.from)) { await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {}); break }
                if (backupInProgress.has(chatId)) { await bot.sendMessage(chatId, '⏳ في نسخة احتياطية شغالة بالفعل').catch(() => {}); break }
                backupInProgress.add(chatId)
                await bot.sendMessage(chatId, '📦 *جاري تجهيز النسخة الاحتياطية...*', { parse_mode: 'Markdown' }).catch(() => {})
                let zipPath = null
                try {
                    zipPath = await makeBackupZip()
                    const size = fs.statSync(zipPath).size
                    const sizeMB = (size / 1024 / 1024).toFixed(2)
                    if (size > 49 * 1024 * 1024) {
                        await bot.sendMessage(chatId, `⚠️ حجم النسخة *${sizeMB}MB* أكبر من حد تيليجرام (50MB)`, { parse_mode: 'Markdown', reply_markup: systemBackKeyboard }).catch(() => {})
                    } else {
                        await bot.sendDocument(chatId, zipPath, { caption: `📦 نسخة احتياطية (كود + قاعدة بيانات)\n📁 ${sizeMB}MB` })
                    }
                } catch (e) {
                    await bot.sendMessage(chatId, '❌ فشل إنشاء النسخة الاحتياطية: ' + (e?.message || e), { reply_markup: systemBackKeyboard }).catch(() => {})
                } finally {
                    backupInProgress.delete(chatId)
                    if (zipPath) fs.unlink(zipPath, () => {})
                }
                break
            }

            case 'start_broadcast': {
                if (!isOwner(query.from)) { await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {}); break }
                const t = broadcastWaitTimers.get(chatId)
                if (t) clearTimeout(t)
                waitingForBroadcast.set(chatId, true)
                broadcastWaitTimers.set(chatId, setTimeout(() => {
                    waitingForBroadcast.delete(chatId)
                    broadcastWaitTimers.delete(chatId)
                }, WAIT_TIMEOUT))
                await bot.sendMessage(chatId, askBroadcastText, { parse_mode: 'Markdown', reply_markup: cancelKeyboard }).catch(() => {})
                break
            }

            case 'confirm_broadcast_send': {
                if (!isOwner(query.from)) { await bot.sendMessage(chatId, notOwnerText, { parse_mode: 'Markdown' }).catch(() => {}); break }
                const pending = pendingBroadcast.get(chatId)
                if (!pending) { await bot.sendMessage(chatId, '⚠️ مفيش رسالة محفوظة، ابدأ الإذاعة من جديد', { reply_markup: systemBackKeyboard }).catch(() => {}); break }
                pendingBroadcast.delete(chatId)
                if (broadcastInProgress.has(chatId)) break
                broadcastInProgress.add(chatId)
                const progressMsg = await bot.sendMessage(chatId, '📢 *جاري الإرسال...*', { parse_mode: 'Markdown' }).catch(() => null)
                broadcastToUsers(pending.text, async (sent, failed, total) => {
                    if (progressMsg) await editSafe(chatId, progressMsg.message_id, `📢 *جاري الإرسال...* ${sent + failed}/${total}`, { parse_mode: 'Markdown' })
                }).then(async (result) => {
                    broadcastInProgress.delete(chatId)
                    await bot.sendMessage(chatId,
                        '╭─❖ ✅ *تمت الإذاعة*\n│\n' +
                        `├ 📤 تم الإرسال: *${result.sent}*\n` +
                        `├ ❌ فشل: *${result.failed}*\n` +
                        `├ 👥 الإجمالي: *${result.total}*\n` +
                        '╰─────────────────❖',
                        { parse_mode: 'Markdown', reply_markup: systemBackKeyboard }
                    ).catch(() => {})
                }).catch(async (e) => {
                    broadcastInProgress.delete(chatId)
                    await bot.sendMessage(chatId, '❌ حصل خطأ أثناء الإذاعة: ' + (e?.message || e), { reply_markup: systemBackKeyboard }).catch(() => {})
                })
                break
            }
        }

        bot.answerCallbackQuery(query.id).catch(() => {})
    })

    // ✧ الرسائل العادية ✧
    bot.on('message', async (msg) => {
        const chatId = msg.chat.id
        const text = (msg.text || '').trim()
        if (text.startsWith('/')) return

        const isWaiting = !!waitingForNumber.get(chatId)
        const isWaitingBroadcast = !!waitingForBroadcast.get(chatId)

        if ((isWaiting || isWaitingBroadcast) && /^(الغاء|إلغاء|cancel|ايقاف|إيقاف|وقف)$/i.test(text)) {
            clearWait(chatId)
            const bt = broadcastWaitTimers.get(chatId)
            if (bt) clearTimeout(bt)
            waitingForBroadcast.delete(chatId)
            broadcastWaitTimers.delete(chatId)
            return bot.sendMessage(chatId, cancelText, { parse_mode: 'Markdown', reply_markup: backKeyboard })
        }

        if (isWaitingBroadcast && isOwner(msg.from)) {
            const bt = broadcastWaitTimers.get(chatId)
            if (bt) clearTimeout(bt)
            waitingForBroadcast.delete(chatId)
            broadcastWaitTimers.delete(chatId)
            if (!text) return bot.sendMessage(chatId, '📢 ابعت *نص* الرسالة فقط 😅', { parse_mode: 'Markdown' })
            const count = getBroadcastTargets().length
            pendingBroadcast.set(chatId, { text })
            return bot.sendMessage(chatId, broadcastConfirmText(text, count), { parse_mode: 'Markdown', reply_markup: broadcastConfirmKeyboard })
        }

        if (installing.has(chatId)) {
            clearWait(chatId)
            return bot.sendMessage(chatId, busyText, { parse_mode: 'Markdown' })
        }

        if (!isWaiting) return
        if (!text) return bot.sendMessage(chatId, '📱 ابعت *الرقم كنص فقط*، مش صورة أو ملف 😅', { parse_mode: 'Markdown' })

        const number = extractNumber(text)
        const info = parsePhone(number)
        if (!info.valid) return bot.sendMessage(chatId, invalidText, { parse_mode: 'Markdown', reply_markup: retryKeyboard })

        clearWait(chatId)
        await runInstall(chatId, number, msg.from)
    })

    return bot
}

export function stopTelegramAdmin() {
    if (!botInstance) return
    try {
        botInstance.stopPolling()
        botInstance.close?.()
    } catch {}
    botInstance = null
    waitingForNumber.clear()
    waitTimers.forEach((t) => clearTimeout(t))
    waitTimers.clear()
    loadingMessages.clear()
    installing.clear()
    waitingForBroadcast.clear()
    broadcastWaitTimers.forEach((t) => clearTimeout(t))
    broadcastWaitTimers.clear()
    pendingBroadcast.clear()
    broadcastInProgress.clear()
    backupInProgress.clear()
    console.log('🛑 تم إيقاف بوت تيليجرام')
}
