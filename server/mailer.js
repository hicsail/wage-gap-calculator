require("dotenv").config();
const fs = require('fs');
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const XLSX = require("xlsx");
const Submission = require("./models/submission");

const fileName = "BWWC_Wage_Gap_Calculator_Emails.xlsx";

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true })
    .then(async () => {
        const submissions = await Submission.find({collected: false});
        console.log('Number uncollected emails: ', submissions.length);

        if (submissions.length > 0) {
            let emailJSON = submissions.map(obj => {
                return {'BWWC Wage Gap Calculator Submitters': obj.email};
            });

            let wb = XLSX.utils.book_new();
            let ws = XLSX.utils.json_to_sheet(emailJSON);
            XLSX.utils.book_append_sheet(wb, ws, "Emails");
            XLSX.writeFile(wb, fileName); // this writes to the local file system but will be deleted after

            const transporter = nodemailer.createTransport({
                host: 'smtp.gmail.com',
                service: 'gmail',
                port: 465,
                secure: true,
                auth: {
                    user: process.env.SMTP_USERNAME,
                    pass: process.env.SMTP_PASSWORD
                }
            });

            const mailConfigurations = {
                from: process.env.SMTP_USERNAME,
                to: process.env.RECEIVER,
                subject: 'BWWC Wage Gap Calculator Submitters',
                text:'Please find attached an excel file of people who have submitted to the wage gap calculator.',
                attachments: [
                    {
                        // filename and content type is derived from path
                        path: `./${fileName}`
                    },
                ]
            };

            transporter.sendMail(mailConfigurations, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email Sent Successfully');
                    console.log(info);

                    // remove excel file from local file system after sending it
                    try {
                        fs.unlinkSync(fileName);
                    } catch (err) {
                        console.error(err);
                    }
                }
            });

            // mark the email addresses as collected
            try {
                await Submission.updateMany({collected: false}, {$set: {collected: true}}, {upsert: true});
            } catch (e) {
                console.log(e);
            }
        }

        mongoose.connection.close();

    });
