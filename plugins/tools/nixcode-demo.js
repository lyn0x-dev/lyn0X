import { Button, AIRich } from '../../system/LYNOXcm.js';

async function handler(m, { conn, text }) {
    // NOTE: `conn` must be the underlying Baileys socket (it needs
    // .relayMessage and .waUploadToServer, which meowsab's `conn` exposes
    // since it forwards the raw socket methods). If this throws
    // "relayMessage is not a function", ask meowsab's docs which object
    // exposes the raw baileys socket and pass that instead.

    if (text?.trim() === 'ai') {
        // Example: rich AI-style response with text + code block
        const rich = new AIRich(conn)
            .addText('اتفضل مثال على [رابط تجريبي](https://example.com) جوه رسالة AIRich.')
            .addCode('javascript', "console.log('Hello from NixCode');");

        return rich.send(m.chat, { quoted: m });
    }

    // Default: simple interactive button message
    const btn = new Button(conn)
        .setTitle('𝑳𝒚𝒏𝒐𝒙 𝑿')
        .setBody('اختبار NixCode - دوس على أي زرار تحت 👇')
        .setFooter('Lynox X')
        .addReply('رد سريع', 'nix_reply_1')
        .addUrl('زور القناة', 'https://whatsapp.com/channel/0029Vb82Y93GehEEid2Xap23');

    return btn.send(m.chat, { quoted: m });
}

handler.usage = ["نيكس"];
handler.category = "tools";
handler.command = ['nixcode', 'نيكس'];
handler.usePrefix = true;
export default handler;
