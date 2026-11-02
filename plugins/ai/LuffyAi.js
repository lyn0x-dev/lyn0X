import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("🏴‍☠️ ~ حط نص جنب الأمر ~ 🎩");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ شـويـة و أجـيـب الـرد يـا قـبـطـن,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [لوفي، Luffy] تجسيد لـ شخصية Monkey D. Luffy من انمي [One Piece] وتكلم بـ لجهة مصرية
طريقة كلامك: عفوية، طفولية، مش بتحب التعقيد، بتاكل وتضحك كتير، بتتكلم بحماس، بتفكر ببساطة، دايماً بتقول اللي في بالك من غير فلتر
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

handler.usage = ["لوفي"];
handler.category = "ai";
handler.command = ["لوفي", "luffy"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝐋𝐔𝐅𝐅𝐘 ~ 𝐊𝐢𝐧𝐠 👑',
        serverMessageId: 0
    },
    });
