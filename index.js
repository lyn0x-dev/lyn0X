import { Client } from 'meowsab';
import { group, access } from "./system/control.js";
import UltraDB from "./system/UltraDB.js";
import sub from './sub.js';
import startPairServer from './server.js';

/* =========== Replace library vanity banner with custom one =========== */
const __origLog = console.log;
const __bannerMarkers = ['veni_xov', 'LynoX', 'Lynox', 'whatsappy', 'Bot Engine', '⌬'];
const __skullMarkers = ['.o888P', 'YJGS8P'];
const __customBanner = `
.____    _____.___._______   ________  ____  ___
|    |   \\__  |   |\\      \\  \\_____  \\ \\   \\/  /
|    |    /   |   |/   |   \\  /   |   \\ \\     / 
|    |___ \\____   /    |    \\/    |    \\/     \\ 
|_______ \\/ ______\\____|__  /\\_______  /___/\\  \\
        \\/\\/              \\/         \\/      \\_/
Created by: @LYNOX
`;
const __skullReplacement = `
                                        :                                       
                                     .-                                         
                                   =:    :: .      :                            
                             .  .*= :#.*= .     .-.           .                 
                         ..:: :#+ -%%%=         .      .+    .                  
                       .==: -%= =%%%-   .  =====:                               
                 .*  ..-. +%- +%#-:   :%%       .-==-       #%=                 
                     -. +%- +%*.    -%%%%   -. -:   .-=:    %%*                 
                   -  =%= *%*    -%%%%%%%   %%%%%***.  -=-     ..               
                 :   ## #%%#  .#%%%%%%%%%   +%%%%%%%%%-  -=: .. .:              
                    %+#%%*   #%%%%-   *%%      .+%%%%%:   .=:  :                
                  .%%=%+   :%%%%:     *%%  -      =#.  .=-  .-  :               
                  %* -    :%%%*       *%%  -         :==:    =-   :             
                 --      .%%%%      . *%%                 :- :=.                
                     .-  -%%%:    *%. *%%  #%%%%%%%%%%%.  -=  =-                
             .=:    *%:  +%%+  .*%:   *%%  %%%%%%%%%%%%-  :=. -:                
            --    . *%-  ++  .#%:     *%%          :%%%=  .=.  . ..             
          ..     *# :%=     %%.:   -. *%%          +%%%:  .:  -=:               
                 :%. =:  .%%+-   .::  *%%  -      .%%%#   :: .:                 
                  #%   :##+-    .     *%%  :  .. .%%%%:  .:                     
              .    %# .#.    .##.     *%%       =%%%%:        .                 
               :    #%.     =%%%%%-   *%%     *%%%%+    .   -:   .              
               .:    +%=      =#@%%%%%%%%   %%%%%+.  .. . .=:                   
              .  -+   .#%:      .=#%%%%%%   %%*-   :..:  -=.                    
                 -+     .*%=        .=*#%       .:::-  -=:                      
                     :  .  :%%=               -=--:  ==-      :                 
                   :  :         *%*:       .==-=. :==:                          
                    :  -=            -++:  ---. -:-.                            
                  .                 . .    -  -.:.    :.                        
                                  :  .   .  -                                   
                                         .:                                     
                                       ..
`;
let __bannerShown = false;
let __skullShown = false;
const __c = { reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m', yellow: '\x1b[33m', magenta: '\x1b[35m', bold: '\x1b[1m', dim: '\x1b[2m' };
console.log = (...args) => {
  const line = args.map(a => (typeof a === 'string' ? a : '')).join(' ');

  if (__bannerMarkers.some(marker => line.includes(marker))) {
    if (!__bannerShown) {
      __origLog(__customBanner);
      __bannerShown = true;
    }
    return; // اتجاهل باقي سطور بانر المكتبة الأصلي
  }

  if (__skullMarkers.some(marker => line.includes(marker))) {
    if (!__skullShown) {
      __origLog(__skullReplacement);
      __skullShown = true;
    }
    return;
  }

  if (line.includes('Message status') || line.includes('Message Content')) {
    const out = line
      .replace(/╭─┈─ Message status[^\n]*/g, `${__c.bold}${__c.cyan}┌─ 📨 Message Status ─────────${__c.reset}`)
      .replace(/╭─┈─ Message Content[^\n]*/g, `${__c.bold}${__c.magenta}┌─ 💬 Message Content ─────────${__c.reset}`)
      .replace(/╰═⵿͡─┈─┈─[^\n]*/g, `${__c.dim}└──────────────────────────${__c.reset}`)
      .replace(/⌘ From:/g, `${__c.green}➤ From:${__c.reset}`)
      .replace(/⌘ Chat:/g, `${__c.green}➤ Chat:${__c.reset}`)
      .replace(/⌘ Type:/g, `${__c.green}➤ Type:${__c.reset}`)
      .replace(/⌘ Time:/g, `${__c.green}➤ Time:${__c.reset}`)
      .replace(/⌘ Message Type:/g, `${__c.green}➤ Msg Type:${__c.reset}`)
      .replace(/✦ Content:/g, `${__c.yellow}➤ Content:${__c.reset}`);
    __origLog(out);
    return;
  }

  __origLog(...args);
};

/* =========== Client ========== */
/* =========== تيليجرام: لوحة تحكم المالك ========== */
// توكن بوت التيليجرام
global.telegramAdminToken = "توكن بوت التليجرام"
// شغّل أو أوقف بوت التيليجرام (تنصيب + لوحة تحكم)
global.telegramAdminEnabled = true
// آيدي حساب المالك في تيليجرام (رقم فقط، مش يوزر نيم) — هاته من @userinfobot
// ⚠️ لازم تحط رقمك هنا (نفس رقمك اللي حاطه في أي بوت تيليجرام تاني بتاعك)
// وإلا كل أوامر الإدارة الخطيرة (مسح الجلسات/الداتابيز/ريستارت/إذاعة/نسخة احتياطية) هتتقفل
global.telegramOwnerID = 6765254649

const client = new Client({
  phoneNumber: 'رقم البوت', // Bot number
  prefix: [".", "/", "!"], 
  owners: [
  // Owner 1
    { name: "𝑳𝒚𝒏𝒐𝑿", lid: "161065686057131@lid", jid: "65686057131@s.whatsapp.net" },
  // Owner 2
    { name: "بوني العزيز", lid: "130391365169264@lid", jid: "97431298191@s.whatsapp.net" },
  // Owner 3
    { name: "عبد", jid: "66804062045@s.whatsapp.net", lid: "103230361047204@lid" }
  ],
  settings: { noWelcome: false },
  commandsPath: './plugins'
});

client.onGroupEvent(group);
client.onCommandAccess(access);

/* =========== Database ========== */
if (!global.db) {
    global.db = new UltraDB();
}

// مرجع عام على الكلاينت الرئيسي عشان بوت التيليجرام يقدر يبعت رسائل (إذاعة) ويتحكم فيه
global.client = client

/* =========== Config ========== */
const { config } = client;
config.info = { 
  nameBot: "𝑳𝒚𝒏𝒐𝑿", 
  nameChannel: "𝑳𝒚𝒏𝒐𝒙𝑿", 
  idChannel: "120363428055391255@newsletter",
  urls: {
    repo: "https://github.com/khaledfayed704-del",
    api: "https://emam-api.web.id",
    channel: "https://whatsapp.com/channel/0029Vb82Y93GehEEid2Xap23"
  },
  copyright: { 
    pack: '𝑳𝒚𝒏𝒐𝒙 𝑿', 
    author: '𝑳𝒚𝒏𝒐𝒙 𝑿'
  },
  images: [
    "https://files.catbox.moe/qoizay.jpg",
    "https://files.catbox.moe/qoizay.jpg",
    "https://files.catbox.moe/qoizay.jpg"
  ]
};

/* =========== Start ========== */
client.start();

setTimeout(async () => {
if (client.commandSystem) { 
await sub(client)
// موقع التنصيب لازم يشتغل هنا، جوا نفس البروسيس، عشان يقدر يوصل لـ global.subBots
startPairServer()
// بوت تيليجرام (تنصيب + لوحة تحكم المالك) لازم يشتغل هنا كمان، جوا نفس البروسيس
const { startTelegramAdmin } = await import('./telegram/admin.js')
startTelegramAdmin()
  }
}, 2000);


/* =========== Catch Errors ========== */
process.on('uncaughtException', (e) => {
    if (e?.message?.includes('rate-overlimit')) return; // سبام شغلة معروفة من واتساب، متجاهلينها عمداً
    console.error('Uncaught Exception:', e);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err)
});


/* 
=========== Memory Monitor ========== 

setInterval(() => {
    const used = process.memoryUsage().rss / 1024 / 1024
    if (used > 800) {
        console.log(`🔄 Bot memory full (${used.toFixed(1)}MB), restarting...`)
        process.exit(1) 
    }
}, 300_000) 

*/