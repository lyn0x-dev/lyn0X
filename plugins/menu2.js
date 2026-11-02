const CATEGORIES = [
    [1, 'التـحـمـيـل', 'downloads', '⬇️'],
    [2, 'الـمـجـمـوعـات', 'group', '👥'],
    [3, 'الـمـلـصـقـات', 'sticker', '🖼️'],
    [4, 'الـمـطـوريـن', 'owner', '👑'],
    [5, 'امـثـلـه', 'example', '🧩'],
    [6, 'الـادوات', 'tools', '🧰'],
    [7, 'الـبـحـث', 'search', '🔎'],
    [8, 'الادمــن', 'admin', '🛡️'],
    [9, 'الالــعـاب', 'games', '🎯'],
    [10, 'الچيف', 'gif', '🎞️'],
    [11, 'الـبــنـك', 'bank', '🏦'],
    [12, 'الـذكـاء الاصـطـنـاعـي', 'ai', '🧠'],
    [13, 'الـبـوتـات الـفـرعـي', 'sub', '🤖'],
    [14, 'مـعـلومـات الـبـوت', 'info', 'ℹ️'],
    [15, 'الـالــقــاب', 'nicknames', '🏷️'],
    [16, 'الـلـوجـوهــات', 'logos', '🔱'],
    [17, 'تـغـيـر الاصـوات', 'voices', '🎙️'],
    [18, 'أخــرى', 'other', '🌌']
];

const getCat = n => CATEGORIES.find(c => c[0] === n);

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝑳𝒚𝒏𝒐𝒙 𝑿',
        serverMessageId: 0
    },
});

const formatUptime = () => {
    const s = process.uptime();
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const MENU_IMG = 'https://files.catbox.moe/qoizay.jpg';

async function handler(m, { conn, bot, command, args }) {
    const selected = parseInt(args[0]);
    const now = new Date();
    const uptime = formatUptime();
    const date = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const pushName = m.pushName || 'صديقي';

    // ─── القائمة الرئيسية ───
    if (!selected && !args[0]) {
        const sections = [{
            title: "🌙✦ الأقسام ✦✨",
            highlight_label: "𝑳𝒚𝒏𝒐𝒙 𝑿",
            rows: CATEGORIES.map(c => ({
                title: `${c[0]} ~ ${c[1]} ${c[3]}`,
                description: `اضغط لعرض أوامر قسم ${c[1]}`,
                id: `.اوامر ${c[0]}`
            }))
        }];

        const menuText = `
*﴿ رَبَّنَا اغْفِرْ لَنَا وَلِإِخْوَانِنَا الَّذِينَ سَبَقُونَا بِالْإِيمَانِ ﴾*

╭─┈─┈─┈─⟞ 🌙 ⟝─┈─┈─┈─╮
│ 🌙↬ *مرحبًا يا* ${pushName}
│ ⚡↬ *وقت التشغيل:* ${uptime}
│ 📅↬ *التاريخ:* ${date}
│ 🕐↬ *الساعة:* ${time}
│ ✨↬ *عدد الأقسام:* ${CATEGORIES.length}
╰─┈─┈─┈─⟞ 🌙 ⟝─┈─┈─┈─╯

> *✨ اختار قسم من القائمة عشان يبعتلك أوامره*

> ━━━〔 *_𝑳𝒚𝒏𝒐𝒙 𝑿_* 〕━━━
> *﴿ وَلَا تَجْعَلْ فِي قُلُوبِنَا غِلًّا لِلَّذِينَ آمَنُوا ﴾*`;

        await conn.sendButtonNormal(m.chat, {
            media: { url: MENU_IMG },
            mediaType: 'image',
            caption: menuText,
            buttons: [{
                name: "single_select",
                params: {
                    title: "🌙 الأقسام ✨",
                    sections: sections
                }
            }],
            mentions: [m.sender],
            newsletter: {
                name: '𝑳𝒚𝒏𝒐𝒙 𝑿',
                jid: '120363428055391255@newsletter'
            }
        }, global.reply_status);
        return;
    }

    // ─── قسم غلط ───
    const cat = getCat(selected);
    if (!cat) {
        await conn.sendMessage(m.chat, {
            image: { url: MENU_IMG },
            caption: `⚠️ *رقم غلط يا ${pushName}!*

✨ اختار رقم من *1* لـ *${CATEGORIES.length}*
📌 أو اكتب *.اوامر* من غير رقم`,
            contextInfo: context(m.sender)
        }, { quoted: m });
        return;
    }

    // ─── عرض أوامر القسم ───
    const cmds = await bot.getAllCommands();
    const categoryCmds = cmds.filter(c => c.category === cat[2]);

    if (!categoryCmds.length) {
        await conn.sendMessage(m.chat, {
            image: { url: MENU_IMG },
            caption: `${cat[3]} *قسم ${cat[1]}*

❌ *لا توجد أوامر في هذا القسم حاليًا*
🌙 ارجع للقائمة اكتب *.اوامر*`,
            contextInfo: context(m.sender)
        }, { quoted: m });
        return;
    }

    const cmdsList = categoryCmds
        .map(c => `${cat[3]} /${c.usage?.join(`\n${cat[3]} /`) || c.name}`)
        .join('\n');

    const catText = `
╭─┈─┈─┈─⟞ ${cat[3]} ⟝─┈─┈─┈─╮
│ *✨ قسم ${cat[1]} ${cat[3]}*
│ *📌 عدد الأوامر:* ${categoryCmds.length}
╰─┈─┈─┈─⟞ ${cat[3]} ⟝─┈─┈─┈─╯

*╭──〔 الأوامر 〕──╮*
${cmdsList}
*╰──〔 الأوامر 〕──╯*

> *✨ ارجع للقائمة اكتب *.اوامر**
> *﴿ رَبَّنَا إِنَّكَ رَءُوفٌ رَّحِيمٌ ﴾*

> ━━━〔 *_𝑳𝒚𝒏𝒐𝒙 𝑿_* 〕━━━`.trim();

    await conn.sendMessage(m.chat, {
        image: { url: MENU_IMG },
        caption: catText,
        contextInfo: context(m.sender)
    }, { quoted: m });
}

handler.command = ['m'];
export default handler;