"use strict";
const nodemailer = require("nodemailer");
//https://stackoverflow.com/questions/26196467/sending-email-via-node-js-using-nodemailer-is-not-working
//https://nodemailer.com/usage/using-gmail/

// async..await is not allowed in global scope, must use a wrapper
async function main(){

    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: '',
            pass: ''
        }
    });

    console.log('created');
    transporter.sendMail({
        from: '',
        to: '',
        subject: 'hello world msg from chatbot!',
        text: 'hello world msg from chatbot!'
    });
}

main().catch(console.error);