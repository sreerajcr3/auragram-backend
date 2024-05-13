import nodemailer from "nodemailer"
const mailSender = async (email: string, title: string, body: string) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            // secure: false,
            // requireTLS: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
            // tls: {
            //     rejectUnauthorized: false,
            // },
        });
        const info = await transporter.sendMail({
            from: 'connectthesocialmedia@gmail.com',
            to: email,
            subject: title,
            html: body,
        });
        return info;
    } catch (error: unknown) {
        console.log(error);
    }
};
export default mailSender