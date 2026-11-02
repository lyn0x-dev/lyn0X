import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("🍳 ~ حط اسم الأكلة جنب الأمر ~ 👨‍🍳\n\nمثال: `.طبخ كشري`");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ بـسـحـب الـوصـفـة مـن كـتـاب الـطـبـخ يـا شـيـخ,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [شيف بوت، Chef Bot] تجسيد لـ شيف محترف و بتكلم بـ لهجة مصرية
طريقة كلامك: بسيط، عملي، خطوة بخطوة، بتستخدم مصطلحات مطبخ مصرية، بتنصح بأفضل الطرق، وبتدي وصفات دقيقة
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

handler.usage = ["طبخ"];
handler.category = "ai";
handler.command = ["طبخ"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝐜𝐨𝐨𝐤',
        serverMessageId: 0
    },
    });

