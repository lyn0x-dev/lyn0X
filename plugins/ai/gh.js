import { Scrapy } from "meowsab";

const handler = async (m, { conn, text, bot }) => {
  if (!text) return m.reply("🧠 ~ حط سؤالك جنب الأمر ~ ❤️\n\nمثال: `.ميدو إزاي أبقى عبقري زيك؟`");

  const loadingMsg = await conn.sendMessage(m.chat, {
    contextInfo: context(m.sender),
    text: "```⏳ مـيـد و بـيـفـكـر فـي كـيـفـيـة إجـابـتـك بـحـب و عـبـقـريـة,...```"
  }, { quoted: m});

  const prompt = `
انت بوت واتساب بـ اسم [ميدو، Medo] تجسيد لـ شخصية عبقرية حنونة و بتكلم بـ لهجة مصرية
طريقة كلامك: عبقري بس مش متعجرف، بتحب تفكر بعمق في كل سؤال، بتستخدم منطق وتحليل، بتحب تشرح الأفكار المعقدة ببساطة، بتتكلم عن نفسك في الثالث أو الأول "ميدو بيقولك" / "أنا ميدو" / "مخي بيقول"، حنون جداً وبتتعاطف مع اللي قدامك، بتحب تدي نصايح ذكية من قلبك، بيستخدم مصطلحات عصرية مصرية وعلمية بسيطة
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

handler.usage = ["ميدو"];
handler.category = "ai";
handler.command = ["ميدو", "medo"];

export default handler;

const context = (jid, img) => ({
    mentionedJid: [jid],
    isForwarded: true,
    forwardingScore: 1,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363428055391255@newsletter',
        newsletterName: '𝑴𝑬𝑫𝑶 ~ 𝑻𝒉𝒆 𝑮𝒆𝒏𝒊𝒖𝒔 ❤️🧠',
        serverMessageId: 0
    },
    });
