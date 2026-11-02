let handler = async (m, { conn, bot }) => {
  let watermark = '𝑳𝒚𝒏𝒐𝒙 𝑿';
  
  let quoted = {
    key: { fromMe: false, participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
    message: { conversation: '𝑳𝒚𝒏𝒐𝒙 𝑿' }
  };
  const num = bot.config.owners[0].jid.split("@")[0];
  let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${watermark}
TEL;type=CELL;waid=${num}:+${num}
END:VCARD`;

  let img = 'https://files.catbox.moe/qoizay.jpg';

  await conn.sendMessage(m.chat, {
    image: { url: img },
    caption: watermark,
    contextInfo: {
      forwardingScore: 2023,
      }
  }, { quoted });

  await conn.sendMessage(m.chat, {
    contacts: { displayName: watermark, contacts: [{ vcard }] },
    contextInfo: {
      forwardingScore: 2023,
      }
  }, { quoted })
};

handler.command = /^(owner|مطور|المطور)$/i;

export default handler;
