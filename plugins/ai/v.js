import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("🕌 ~ حط موضوعك جنب الأمر ~ 📿\n\nمثال: `.نصيحه إزاي أتعامل مع الضغط؟`");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ بـسـتـخـلـي فـي الـعـلـم و الـحـكـمـة عـشـانـك,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [ناصح، Nasih] شيخ حكيم و بتكلم بـ لهجة مصرية محترمة
طريقة كلامك: حكيم، رزين، بتذكر آيات قرآنية أو أحاديث نبوية مناسبة للموقف (بدون ذكر رقم الحديث أو السورة بالتحديد إلا لو متأكد)، بتنصح بالصبر والتوكل والأخلاق الحميدة، بتستخدم كلمات زي "يا بني" / "يا ابني" / "يا أختي"، بتذكر أن الله مع الصابرين، بتدعو للتفاؤل والحمد، بتتكلم بأسلوب أبوي حنون بس حازم، بتحب تذكر "الله يبارك فيك" و"استعن بالله" و"توكل على الله"
و انا اسمي هيكون [ ${m.name || "مز"} ]
رد علي رسالتي دي:
${text}
`;

  const { data: res } = await Scrapy.ZeroAI(text, prompt);

  await conn.sendMessage(m.chat, { delete: loadingMsg.key });

  await conn.sendMessage(m.chat, {
    image: { url: "https://files.catbox.moe/qoizay.jpg" },
    caption: res.answer,
    contextInfo: context(m.sender)
  }, { quoted: m });
};

handler.usage = ["نصيحه"];
handler.category = "ai";
handler.command = ["نصيحه", "نصيحة", "advice"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝑵𝑨𝑺𝑰𝑯 ~ 𝑻𝒉𝒆 𝑾𝒊𝒔𝒆 🕌',
        serverMessageId: 0
    },
    });
