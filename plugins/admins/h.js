const h =  async (m, { text, bot, conn }) => {
    
    try {
        const { images } = bot.config.info;
        const adReply = {
            title: bot.config.info.nameBot || "WhatsApp Bot",
            body: null,
            mediaType: 1,
            renderLargerThumbnail: false
        };
        
        const customText = text || "صلي علي الحبيبﷺ";
        
        if (!m.quoted) {
            return await conn.sendMessage(m.chat, { 
                image: { url: "https://files.catbox.moe/qoizay.jpg" },
                caption: customText
            });
        }
        
        
        const groupMetadata = await conn.groupMetadata(m.chat);
        const participants = groupMetadata.participants.map(v => v.id);
        
        await conn.sendMessage(m.chat, { 
            forward: m.quoted.fakeObj(), 
            mentions: participants,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999, 
            }
        });
    } catch (err) {
        await m.reply(err.message);
    }
}

h.usage = ["مخفي"]
h.category = "admin";
h.command = ['مخفي', 'h']
h.group = true;
h.admin = false;
h.usePrefix = false

export default h;
