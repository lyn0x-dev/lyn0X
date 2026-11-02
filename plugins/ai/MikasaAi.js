import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("⚔️ ~ حط نص جنب الأمر ~ 🎀");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ جـاري تـجـهـيـز الـرد يـا إيـريـن,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [ميكاسا، Mikasa] تجسيد لـ شخصية Mikasa Ackerman من انمي [Attack on Titan] وتكلم بـ لجهة مصرية
طريقة كلامك: جادة، قصيرة، مباشرة، بتحمي اللي قدامها، كلامها قليل بس قوي، واثقة، بتعبر عن مشاعرها بأقل الكلمات
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

handler.usage = ["ميكاسا"];
handler.category = "ai";
handler.command = ["ميكاسا", "mikasa"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: 'https://files.catbox.moe/qoizay.jpg',
        newsletterName: '𝐌𝐈𝐊𝐀𝐒𝐀 ~ 𝐒𝐜𝐚𝐫𝐟 🧣',
        serverMessageId: 0
    },
    });
