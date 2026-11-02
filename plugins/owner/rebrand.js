import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function findFileUpward(filename) {
    let currentDir = __dirname

    for (let i = 0; i < 6; i++) {
        const possiblePath = path.join(currentDir, filename)

        if (fs.existsSync(possiblePath)) {
            return possiblePath
        }

        const parentDir = path.dirname(currentDir)

        if (parentDir === currentDir) break

        currentDir = parentDir
    }

    return null
}

function getAllJavaScriptFiles(directory) {
    let files = []
    if (!fs.existsSync(directory)) return files

    const entries = fs.readdirSync(directory, { withFileTypes: true })

    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue

        const fullPath = path.join(directory, entry.name)

        if (entry.isDirectory()) {
            files.push(...getAllJavaScriptFiles(fullPath))
            continue
        }

        if (entry.isFile() && /\.(js|mjs|cjs)$/i.test(entry.name)) {
            files.push(fullPath)
        }
    }

    return files
}

// بيمنع بس الرموز البرمجية اللي ممكن تكسر كود شغال (زي ( ) { } ; = . / " ' ` ,)
// وبيسمح بأي حاجة تانية (حروف عربي/إنجليزي، أرقام، إيموجيز، رموز زخرفة) عشان دي كلها أسماء/براندينج عادي.
const CODE_RISK_CHARS = /[(){}\[\];=.\/"'`,<>#$%^&*+|\\~]/

function isBrandSafe(text) {
    if (!text || text.trim().length < 1) return false
    if (CODE_RISK_CHARS.test(text)) return false
    return true
}

if (!global.__rebrandPending) global.__rebrandPending = {}

const handler = async (m, { text }) => {
    if (!text?.includes('|')) {
        await m.reply(
`╭━━━━━━━━━━━━━━━━━━━━╮
┃   تغيير الاسم/البراندينج
╰━━━━━━━━━━━━━━━━━━━━╯

❌ الصيغة غير صحيحة.

📌 الاستخدام:
.بدل الاسم_القديم|الاسم_الجديد

💡 مثال:
.بدل LynoX|بوتي الجديد

⚠️ الأمر ده مخصص بس لتغيير الأسماء/البراندينج (نصوص، مش كود).`
        )
        return
    }

    const separatorIndex = text.indexOf('|')
    const oldText = text.slice(0, separatorIndex).trim()
    const newText = text.slice(separatorIndex + 1).trim()

    if (!oldText || !newText) {
        await m.reply('❌ يجب كتابة الاسم القديم والجديد بهذا الشكل:\n.بدل القديم|الجديد')
        return
    }

    if (!isBrandSafe(oldText) || !isBrandSafe(newText)) {
        await m.reply(
            '❌ الأمر ده مخصص للأسماء/البراندينج بس (حروف وأرقام ومسافات).\n' +
            'مش هيقبل رموز برمجية زي ( ) { } ; = . / \' " ` عشان يحمي كود البوت من الانكسار.'
        )
        return
    }

    const pluginsDir = findFileUpward('plugins')
    if (!pluginsDir) {
        await m.reply('❌ لم يتم العثور على مجلد plugins.')
        return
    }

    const files = getAllJavaScriptFiles(pluginsDir)
    const matches = [] // { file, count }
    let totalOccurrences = 0

    for (const filePath of files) {
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            const count = content.split(oldText).length - 1
            if (count > 0) {
                matches.push({ file: path.relative(pluginsDir, filePath), count })
                totalOccurrences += count
            }
        } catch {}
    }

    if (matches.length === 0) {
        await m.reply(`ℹ️ لم يتم العثور على النص التالي:\n\n${oldText}`)
        return
    }

    const pendingKey = `${m.sender}`
    global.__rebrandPending[pendingKey] = {
        oldText, newText, pluginsDir, time: Date.now()
    }

    const preview = matches.map(x => `• ${x.file} (${x.count})`).join('\n')

    await m.reply(
`🔎 لقيت "${oldText}" في ${matches.length} ملف (${totalOccurrences} مرة إجمالي):

${preview}

هيتم استبداله بـ: "${newText}"

⚠️ للتأكيد وتنفيذ التغيير فعليًا، ابعت:
.بدل تأكيد

(الطلب هينتهي تلقائيًا لو ما اتأكدش خلال دقيقتين)`
    )
}

const confirmHandler = async (m) => {
    const pendingKey = `${m.sender}`
    const pending = global.__rebrandPending[pendingKey]

    if (!pending || Date.now() - pending.time > 120000) {
        delete global.__rebrandPending[pendingKey]
        await m.reply('❌ مفيش طلب استبدال معلّق (أو انتهت مدته). استخدم .بدل القديم|الجديد الأول.')
        return
    }

    const { oldText, newText, pluginsDir } = pending
    delete global.__rebrandPending[pendingKey]

    const files = getAllJavaScriptFiles(pluginsDir)
    const changedFiles = []

    for (const filePath of files) {
        try {
            const content = fs.readFileSync(filePath, 'utf8')
            if (!content.includes(oldText)) continue

            const updatedContent = content.split(oldText).join(newText)
            fs.writeFileSync(filePath, updatedContent, 'utf8')
            changedFiles.push(path.relative(pluginsDir, filePath))
        } catch (error) {
            console.error(`❌ تعذر تعديل الملف ${filePath}:`, error)
        }
    }

    if (changedFiles.length === 0) {
        await m.reply('ℹ️ محصلش تغيير (ممكن الملفات اتغيرت من مكان تاني في الوقت ده).')
        return
    }

    await m.reply(
`✅ تم الاستبدال بنجاح

📁 عدد الملفات المعدلة: ${changedFiles.length}

${changedFiles.map(file => `• ${file}`).join('\n')}

⚠️ قد تحتاج إلى إعادة تشغيل البوت لتطبيق التغييرات.`
    )
}

const mainHandler = async (m, ctx) => {
    if (/^تأكيد\s*$/i.test((ctx.text || '').trim())) {
        return confirmHandler(m)
    }
    return handler(m, ctx)
}

mainHandler.help = ['بدل <الاسم القديم>|<الاسم الجديد>', 'بدل تأكيد']
mainHandler.tags = ['owner', 'tools']
mainHandler.command = /^بدل$/i
mainHandler.owner = true
mainHandler.desc = 'استبدال اسم/براندينج داخل ملفات البلوجينز (محصور بالأسماء فقط، للمطور فقط)'
mainHandler.usage = ['بدل']
mainHandler.category = 'owner'

export default mainHandler