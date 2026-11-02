// plugins/m3.js
// 🌙 نفس أقسام وأوامر .اوامر (menu2.js) بس بشكل عرض مختلف — أمر .m3 / .اوامر / .menu / .امر / .الاوامر

import { performance } from 'perf_hooks';
import { ButtonV2 } from '../system/LYNOXcm.js';

// ⚠️ نفس القائمة بالظبط اللي في plugins/menu.js (.m)
// لو ضفت/غيرت قسم هناك، حدّثه هنا كمان عشان يفضلوا متطابقين
// العنصر الخامس [رابط الصورة] اختياري - لو سبته فاضي هياخد صورة المنيو الافتراضية
const CATEGORIES = [
    [1, 'التـحـمـيـل', 'downloads', '📥', 'https://files.catbox.moe/eezag9.png'],
    [2, 'الـمـجـمـوعـات', 'group', '👥', 'https://files.catbox.moe/eezag9.png'],
    [3, 'الـمـلـصـقـات', 'sticker', '🏷️', 'https://files.catbox.moe/eezag9.png'],
    [4, 'الـمـطـوريـن', 'owner', '👑', 'https://files.catbox.moe/eezag9.png'],
    [5, 'امـثـلـه', 'example', '🧪', 'https://files.catbox.moe/eezag9.png'],
    [6, 'الـادوات', 'tools', '🧰', 'https://files.catbox.moe/eezag9.png'],
    [7, 'الـبـحـث', 'search', '🔭', 'https://files.catbox.moe/eezag9.png'],
    [8, 'الادمــن', 'admin', '🛡️', 'https://files.catbox.moe/eezag9.png'],
    [9, 'الالــعـاب', 'games', '🎲', 'https://files.catbox.moe/eezag9.png'],
    [10, 'الچيف', 'gif', '🎞️', 'https://files.catbox.moe/eezag9.png'],
    [11, 'الـبــنـك', 'bank', '🏦', 'https://files.catbox.moe/eezag9.png'],
    [12, 'الـذكـاء الاصـطـنـاعـي', 'ai', '🧠', 'https://files.catbox.moe/eezag9.png'],
    [13, 'الـبـوتـات الـفـرعـي', 'sub', '🤖', 'https://files.catbox.moe/eezag9.png'],
    [14, 'مـعـلومـات الـبـوت', 'info', '📜', 'https://files.catbox.moe/eezag9.png'],
    [15, 'الـالــقــاب', 'nicknames', '💠', 'https://files.catbox.moe/eezag9.png'],
    [16, 'الـلـوجـوهــات', 'logos', '🖌️', 'https://files.catbox.moe/eezag9.png'],
    [17, 'تـغـيـر الاصـوات', 'voices', '🎙️', 'https://files.catbox.moe/eezag9.png'],
    [18, 'أخــرى', 'other', '🎁', 'https://files.catbox.moe/eezag9.png']
];

const getCat = n => CATEGORIES.find(c => c[0] === n);

const MENU_IMG = 'https://files.catbox.moe/mkyr6z.png';

const LINE = `✦ ═══ 〔 ⭑ 𝑳𝒚𝒏𝒐𝒙 𝑿 ⭑ 〕 ═══ ✦`;
const SUB  = `•・───────────・✦・───────────・•`;

// نفس الفانكشن اللي في menu.js (.m) عشان الرسائل تظهر "معاد توجيهها" من قناة البوت
const context = (jid) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝑳𝒚𝒏𝒐𝒙 𝑿',
        serverMessageId: 0
    },
});

function getUptime() {
    const s = process.uptime();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

async function handler(m, { conn, bot, args }) {
    try {
        const start = performance.now();
        const selected = parseInt(args[0]);
        const pushName = m.pushName || m.sender.split('@')[0];
        const uptime = getUptime();
        const fecha = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const hora = new Date().toLocaleTimeString('ar-EG');

        // ─── القائمة الرئيسية (شكل أزرار مختلف عن .اوامر) ───
        if (!selected && !args[0]) {
            const cmds = await bot.getAllCommands();
            const activeCats = CATEGORIES.filter(cat =>
                cmds.some(c => c.usage?.length && (c.category || 'other') === cat[2])
            ).length;

            const bodyText = `${LINE}
╭─ 🌙 الاسم ↞ ${pushName}
├─ 👑 المطور ↞ 𝑳𝒚𝒏𝒐𝒙 𝑿
├─ 📆 التاريخ ↞ ${fecha}
├─ 🕰️ الوقت ↞ ${hora}
├─ ⏱️ التشغيل ↞ ${uptime}
├─ 🤍 إجمالي الأوامر ↞ ${cmds.length}
╰─ 🗂️ الأقسام النشطة ↞ ${activeCats}/${CATEGORIES.length}
${SUB}

> *🌟 اختار قسم من تحت عشان يبعتلك أوامره*`;

            await conn.sendMessage(m.chat, { react: { text: '🌙', key: m.key } });

            await new ButtonV2(conn)
                .setBody(bodyText)
                .setFooter(' ⟨ 𝑳𝒚𝒏𝒐𝒙 𝑿 ⟩ ')
                .setThumbnail(MENU_IMG)
                .setContextInfo(context(m.sender))
                .addRawButton({
                    buttonText: { displayText: '✦ ◂◄ الأقسام ►▸ ✦' },
                    buttonId: 'm3-cats',
                    type: 1,
                    nativeFlowInfo: {
                        name: 'single_select',
                        paramsJson: JSON.stringify({
                            title: "اختر القسم",
                            sections: [{
                                title: " 【 🌙 الأقسام 】",
                                rows: CATEGORIES.map(c => ({
                                    title: `${c[3]} ${c[1]}`,
                                    description: `اضغط لعرض أوامر قسم ${c[1]}`,
                                    id: `.m3 ${c[0]}`
                                }))
                            }]
                        })
                    }
                })
                .addButton('⚙️ ◂◄ تنصيب بوت فرعي ►▸ ⚙️', '.تنصيب')
                .send(m.chat);
            return;
        }

        // ─── رقم قسم غلط ───
        const cat = getCat(selected);
        if (!cat) {
            return m.reply(`🚫 رقم غلط يا ${pushName}!\n🌟 اختار رقم من 1 لـ ${CATEGORIES.length}\n📌 أو اكتب *.m3* من غير رقم`);
        }

        // ─── عرض أوامر القسم (نفس منطق .m بالظبط: فلترة usage + fallback 'other') ───
        const cmds = await bot.getAllCommands();
        const categoryCmds = cmds.filter(c => c.usage?.length && (c.category || 'other') === cat[2]);

        if (!categoryCmds.length) {
            return m.reply(`${cat[3]} قسم ${cat[1]}\n\n🚫 لا توجد أوامر في هذا القسم حاليًا\n🌙 ارجع للقائمة اكتب *.m3*`);
        }

        const cmdsList = categoryCmds
            .map(c => `• /${c.usage?.join(`\n• /`) || c.name}`)
            .join('\n');

        const catText = `${LINE}
╭─ 🌙 القسم ↞ ${cat[1]} ${cat[3]}
╰─ 🔢 عدد الأوامر ↞ ${categoryCmds.length}
${SUB}
${cmdsList}
${SUB}
> ↩️ ارجع للقائمة اكتب *.اوامر*`;

        await conn.sendMessage(m.chat, {
            image: { url: cat[4] || MENU_IMG },
            caption: catText,
            contextInfo: context(m.sender)
        }, { quoted: m });

    } catch (e) {
        console.error('[Lynox-m3] Error:', e);
        return m.reply('💥 حصل خطأ في عرض القائمة، حاول تاني.');
    }
}

handler.help = ['m3', 'اوامر', 'menu', 'امر', 'الاوامر'];
handler.tags = ['main'];
handler.category = 'main';
handler.usage = ['m3'];
handler.command = ['m3', 'اوامر', 'menu', 'امر', 'الاوامر'];
handler.usePrefix = true;

export default handler;