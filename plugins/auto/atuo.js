export default async function before(m, { conn, bot }) {
    const g = global.db?.groups[m.chat];
    const u = global.db?.users[m.sender];

    // 🚫 البوت ميردش خالص في الخاص/البرايفت لأي حد - يشتغل في الجروبات بس
    if (!m.isGroup) return true;

    if (u?.banned && !m.isOwner) return true;
    
    if (g?.adminOnly && !m.isOwner && !m.isAdmin) return true;
    
    if (global.db?.dev && !m.isOwner && !m.isGroup) return true;
    
    if (global.db?.ownerOnly && !m.isOwner) return true;
    
    return false;
};