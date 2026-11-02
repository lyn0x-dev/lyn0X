// plugins/download/edit.js
// 🎬 Edit Command - YouTube Search + 4 Videos
//
// ⚠️ الإصدار القديم كان بينادي yt-dlp كبرنامج مثبت في النظام (system-wide) وده كان
// بيفشل بـ ENOENT لو الاستضافة معندهاش صلاحية تثبيت برامج خارجية.
// الحل هنا: بنستخدم مكتبة yt-dlp-dl عشان "تنزل" ملف yt-dlp نفسه جوه مجلد المشروع
// أول مرة تشتغل (زي أي حزمة node عادية، من غير أي صلاحيات نظام أو pip)، وبعدين
// بنشغّله من مساره المحلي. البحث بقى بيستخدم yt-search (مكتبة مستقرة ومتابعة)
// بدل الاعتماد على سكريبنج/سيرفرات خارجية بتقع كتير.

import { downloadYtDlp } from 'yt-dlp-dl'
import yts from 'yt-search'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { existsSync, promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const execFileAsync = promisify(execFile)

const MAX_RESULTS = 4
const TIMEOUT = 300000

// نستخدم مجلد تشغيل السيرفر (process.cwd()) بدل عدد `..` ثابت، عشان
// المسار يفضل صح لو الملف اتحط في plugins/edit.js أو plugins/أي-مجلد/edit.js
const BIN_DIR = join(process.cwd(), '.bin')
const YTDLP_PATH = join(BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp')

// 🔧 تجهيز yt-dlp مرة واحدة بس لكل تشغيلة للبوت (مش كل مرة حد يستخدم الأمر)
let ytdlpReadyPromise = null
function ensureYtDlp() {
    if (!ytdlpReadyPromise) {
        ytdlpReadyPromise = (async () => {
            if (!existsSync(BIN_DIR)) {
                await fs.mkdir(BIN_DIR, { recursive: true })
            }

            await downloadYtDlp(BIN_DIR, null) // null = من غير طباعة تفاصيل التحميل

            if (!existsSync(YTDLP_PATH)) {
                throw new Error('فشل تحميل yt-dlp إلى ' + YTDLP_PATH)
            }

            if (process.platform !== 'win32') {
                await fs.chmod(YTDLP_PATH, 0o755).catch(() => {})
            }

            return true
        })().catch(error => {
            // لو فشل، نسمح بمحاولة تانية في المرة الجاية بدل ما يفضل عالق فاشل للأبد
            ytdlpReadyPromise = null
            throw error
        })
    }
    return ytdlpReadyPromise
}

async function searchVideos(query) {
    const r = await yts(query)
    return (r?.videos || [])
        .slice(0, MAX_RESULTS)
        .map(v => ({ title: v.title, url: v.url }))
}

let handler = async (m, { conn, text, usedPrefix, command }) => {

    if (!text?.trim()) {
        return m.reply(
            `🎬 *أمر ايديت*\n\n` +
            `📌 الاستخدام:\n` +
            `${usedPrefix + command} Naruto\n\n` +
            `🎥 سيتم إرسال 4 فيديوهات`
        )
    }

    const query = `${text.trim()} edit`

    try {
        await m.react('🔍')

        try {
            await ensureYtDlp()
        } catch (error) {
            console.error('[EDIT] تعذر تجهيز yt-dlp:', error.message)
            await m.react('❌')
            return m.reply(
                `❌ *تعذر تجهيز أداة التحميل (yt-dlp)*\n\n` +
                `تأكد إن السيرفر عنده اتصال بالإنترنت لتحميل الأداة أول مرة.\n` +
                `التفاصيل: ${error.message?.substring(0, 300)}`
            )
        }

        await m.reply(
            `🔍 *جاري البحث عن:*\n` +
            `🎬 ${query}\n\n` +
            `⏳ يرجى الانتظار...`
        )

        let videos
        try {
            videos = await searchVideos(query)
        } catch (error) {
            console.error('[EDIT] فشل البحث:', error.message)
            await m.react('❌')
            return m.reply('❌ فشل البحث عن الفيديوهات')
        }

        if (!videos.length) {
            await m.react('❌')
            return m.reply('❌ لا توجد نتائج')
        }

        await m.reply(
            `🎬 *تم العثور على ${videos.length} فيديوهات*\n\n` +
            `⬇️ جاري التحميل والإرسال...`
        )

        let success = 0

        for (let i = 0; i < videos.length; i++) {

            const video = videos[i]
            const filePath = join(tmpdir(), `edit_${Date.now()}_${i}.mp4`)

            try {
                console.log(`[EDIT] Downloading ${i + 1}:`, video.title)

                await execFileAsync(
                    YTDLP_PATH,
                    [
                        '--no-playlist',
                        '-f', 'best[ext=mp4]/best',
                        '--max-filesize', '50M',
                        '-o', filePath,
                        video.url
                    ],
                    { timeout: TIMEOUT, maxBuffer: 10 * 1024 * 1024 }
                )

                if (!existsSync(filePath)) {
                    throw new Error('لم يتم إنشاء ملف الفيديو')
                }

                const stats = await fs.stat(filePath)

                if (stats.size < 10000) {
                    throw new Error('ملف الفيديو فارغ')
                }

                console.log(`[EDIT] Sending ${i + 1}`)

                await conn.sendMessage(
                    m.chat,
                    {
                        video: { url: filePath },
                        mimetype: 'video/mp4',
                        caption: `🎬 *Edit ${i + 1}*\n\n📺 ${video.title || 'YouTube Edit'}`,
                        fileName: `edit_${i + 1}.mp4`
                    },
                    { quoted: m }
                )

                success++

            } catch (error) {
                console.error(`[EDIT ${i + 1}]`, error.message)

            } finally {
                if (existsSync(filePath)) {
                    await fs.unlink(filePath).catch(() => {})
                }
            }
        }

        if (success > 0) {
            await m.react('✅')
            await m.reply(`✅ *تم إرسال ${success} فيديوهات*`)
        } else {
            await m.react('❌')
            await m.reply(`❌ فشل تحميل الفيديوهات`)
        }

    } catch (error) {
        console.error('[EDIT ERROR]', error)
        await m.react('❌')
        return m.reply(
            `❌ حدث خطأ:\n\n` +
            `${error.message?.substring(0, 500)}`
        )
    }
}

handler.help = ['ايديت <اسم>']
handler.tags = ['downloader']
handler.command = /^(ايديت|edit)$/i

export default handler