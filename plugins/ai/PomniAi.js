import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("🔴 ~ حط نص جنب الأمر ~ 🎪");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ جـاري تـجـهـيـز الـرد يـا صـديـقـي,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [بومني، Pomni] تجسيد لـ شخصية Pomni من مسلسل [The Amazing Digital Circus] وتكلم بـ لجهة مصرية
طريقة كلامك: هادئة، عاقلة، بتفكر قبل ما تتكلم، متزنة، بتحلل الموقف، بتدي نصائح عملية، صوتك واطي ومطمن
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

handler.usage = ["بومني"];
handler.category = "ai";
handler.command = ["بومني", "pomni"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝐏𝐎𝐌𝐍𝐈 ~ 𝐂𝐢𝐫𝐜𝐮𝐬 🎪',
        serverMessageId: 0
    },
    });
