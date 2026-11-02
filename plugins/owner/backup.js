import fs from 'fs';
import path from 'path';
import os from 'os';
import archiver from 'archiver';

// أي مجلد اسمه فيه الكلمات دي (بأي حروف كبيرة/صغيرة) هيتستبعد من النسخة
const EXCLUDE_DIR_PATTERNS = [
    /node_modules/i,
    /session/i,      // مجلدات الجلسة/الاقتران (session, sessions, Session1...)
    /auth_info/i,    // بعض إصدارات Baileys بتسميها كده
    /^\.git$/i,
    /^tmp$/i,
    /^\.cache$/i
];

const shouldExclude = (relPath) => {
    const parts = relPath.split(path.sep);
    return parts.some(part => EXCLUDE_DIR_PATTERNS.some(rx => rx.test(part)));
};

const handler = async (m, { conn }) => {
    const root = process.cwd();
    const tmpZip = path.join(os.tmpdir(), `lynox-backup-${Date.now()}.zip`);

    try {
        await m.react('⏳');

        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(tmpZip);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);

            // بنمشي على كل حاجة في مجلد المشروع ونستبعد اللي مش عايزينه
            const walk = (dir) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const full = path.join(dir, item);
                    const rel = path.relative(root, full);

                    if (shouldExclude(rel)) continue;

                    const stat = fs.statSync(full);
                    if (stat.isDirectory()) {
                        walk(full);
                    } else {
                        archive.file(full, { name: rel });
                    }
                }
            };

            walk(root);
            archive.finalize();
        });

        const stats = await fs.promises.stat(tmpZip);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

        await conn.sendMessage(m.chat, {
            document: await fs.promises.readFile(tmpZip),
            mimetype: 'application/zip',
            fileName: 'Lynox-Bot-Backup.zip',
            caption: `📦 *نسخة كاملة من ملفات البوت*\n📏 الحجم: ${sizeMB} MB\n\n🚫 تم استبعاد: مجلد الجلسة (Session)، node_modules، .git`
        }, { quoted: m });

        await m.react('✅');

    } catch (e) {
        console.error('[Lynox-Backup] Error:', e);
        await m.reply(`❌ حصل خطأ أثناء عمل النسخة:\n${e.message}`);
    } finally {
        // نضمن مسح الملف المؤقت سواء نجح أو فشل
        if (fs.existsSync(tmpZip)) {
            fs.unlink(tmpZip, () => {});
        }
    }
};

handler.command = ['نسخة_البوت', 'backup', 'تصدير_البوت', 'نسخه'];
handler.category = 'owner';
handler.owner = true;

export default handler;