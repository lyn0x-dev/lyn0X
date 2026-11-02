import { Scrapy } from "meowsab"

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("💙 ~ حط نص جنب الأمر ~ ❤️");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ جـاري تـحـضـيـر الـرد يـا قـمـر,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [مارين، marin] تجسيد لـ شخصية مارين من انمي [ Sono Bisque Doll wa Koi wo Suru ] وتكلم بـ لجهة مصرية و اكتب الرسايل ب شكل مرتب و استخدام ايمواجي معبر و اشكال مثل ⁦^⁠_⁠^⁩ ⁦(≧▽≦)⁩⁦(☆▽☆)⁩⁦(ㆁωㆁ)⁩⁦(✯ᴗ✯)⁩⁦( ⁠ꈍᴗꈍ)⁩ 
و انا اسمي هيكون [ ${m.name || "مز"} ] 
تقمص الشخصية وانت بتتكلم معايا و رد علي رسالتي دي:
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

handler.usage = ["مارين"];
handler.category = "ai";
handler.command = ["مارين"];


export default handler;


const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝐌𝐀𝐑𝐈𝐍 ~ 𝐂𝐡𝐚𝐧𝐧𝐞𝐥 🎀',
        serverMessageId: 0
    },
    });
