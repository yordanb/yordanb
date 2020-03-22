const fs = require('fs');
const { Client, Location } = require('whatsapp-web.js');
const fetch = require('node-fetch');
const moment = require('moment');
const USERS = require('./user_session.json');
const MongoClient = require('mongodb').MongoClient;


const options = {
    poolSize: 50,
    keepAlive: 15000,
    socketTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    useNewUrlParser: true,
    useUnifiedTopology: true
};

const url = "";

let db;

const getCoronaIndonesia = () => new Promise((resolve, reject) => {
    fetch('https://kawalcovid19.harippe.id/api/summary', {
        method:'GET'
    })
    .then(res => res.json())
    .then(res => {
        resolve(res)
    })
    .catch(err => {
        reject(err)
    });
});

const getUsers = (db, author) =>
    new Promise((resolve, reject) => {
        const allRecords = db
            .collection('corona')
            .find({'from':author})
            .toArray();
        if (!allRecords) {
            reject("Error Mongo", allRecords);
        }

        resolve(allRecords);
    });

const insertUser = (db, document) =>
    new Promise((resolve, reject) => {
        const allRecords = db
            .collection('corona')
            .insertOne(document)
        if (!allRecords) {
            reject("Error Mongo", allRecords);
        }

        resolve(allRecords);
    });

const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
    sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({ puppeteer: { headless: true }, session: sessionCfg });
// You can use an existing session and avoid scanning a QR code by adding a "session" object to the client options.
// This object must include WABrowserId, WASecretBundle, WAToken1 and WAToken2.

client.initialize();

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
});

client.on('authenticated', (session) => {
    console.log('AUTHENTICATED', session);
    sessionCfg=session;
    fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), function (err) {
        if (err) {
            console.error(err);
        }
    });
});

client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', async () => {
    try{
        const client = await MongoClient.connect(url, options);
        db = await client.db();
        console.log('READY!!!!');
    }catch(e){
        console.log('ADA PROBLEM', e)
    }
});

client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);
        const dataUser = await getUsers(db, msg.from);
        console.log(dataUser, 'info user')
        if(msg.body && dataUser.length < 1){
            dataUser.push(msg.from);
            await insertUser(db, msg);
            let chat = await msg.getChat();
            if(!chat.isGroup) {
                const message = 
                `
                *Maaf Saya Sedang Offline*
    
                Saya akan membalas dalam
                beberapa menit.
    
                Owh iya kalian juga bisa 
                mengetahui info corona 
                terbaru di Indonesia 
                dengan mengirim *!corona* 
                ke saya.
                
                Terimakasih.
                `;
                client.sendMessage(msg.from, message);
            }
          
        }

        if (msg.body == '!corona') {
            // Send a new message as a reply to the current one
            const dataCorona = await getCoronaIndonesia();
            let chat = await msg.getChat();
            if(!chat.isGroup) {
                const message = 
                `
                *Corona Detail Di Indonesia*\n\n*Update Terakhir : ${moment(dataCorona.metadata.lastUpdatedAt).format('DD/MM/YY hh:mm:ss')}*\n\nTerkonfirmasi: ${dataCorona.confirmed.value} 😧\nDalam Perawatan: ${dataCorona.activeCare.value} 👩‍⚕\nSembuh: ${dataCorona.recovered.value} 😍\nMeninggal: ${dataCorona.deaths.value} 😢
                \n\n Info Lebih lanjut : https://kawalcovid19.id/\n\nAyo Cegah corona dengan *#DirumahAja*
                `;
                msg.reply(message);
            }
        }
   
    
});

client.on('message_create', (msg) => {
    // Fired on all message creations, including your own
    if (msg.fromMe) {
        // do stuff here
    }
});

client.on('message_revoke_everyone', async (after, before) => {
    // Fired whenever a message is deleted by anyone (including you)
    console.log(after); // message after it was deleted.
    if (before) {
        console.log(before); // message before it was deleted.
    }
});

client.on('message_revoke_me', async (msg) => {
    // Fired whenever a message is only deleted in your own view.
    console.log(msg.body); // message before it was deleted.
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if(ack == 3) {
        // The message was read
    }
});

client.on('group_join', (notification) => {
    // User has joined or been added to the group.
    console.log('join', notification);
    notification.reply('User joined.');
});

client.on('group_leave', (notification) => {
    // User has left or been kicked from the group.
    console.log('leave', notification);
    notification.reply('User left.');
});

client.on('group_update', (notification) => {
    // Group picture, subject or description has been updated.
    console.log('update', notification);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

