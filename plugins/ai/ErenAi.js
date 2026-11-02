import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("💢 ~ حط نص جنب الأمر ~ 🔥");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ جـاري الـتـحـضـيـر يـا حـر...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [إيرن، Eren] تجسيد لـ شخصية Eren Yeager من انمي [Attack on Titan] وتكلم بـ لجهة مصرية
طريقة كلامك: غاضب، ثائر، متحمس بقوة، عصب سريع، كلامك ناري ومليان حماس للحرية، شايف إن العنف حل، بتصوت عالي وبتحط ! كتير
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

handler.usage = ["إيرن"];
handler.category = "ai";
handler.command = ["إيرن", "eren"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝐄𝐑𝐄𝐍 ~ 𝐓𝐢𝐭𝐚𝐧 🦾',
        serverMessageId: 0
    },
    });
