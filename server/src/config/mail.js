import nodemailer from "nodemailer";

//       MAIL TRANSPORTER CONFIGURATION

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || "gmail",

  host: process.env.MAIL_HOST,

  port: Number(process.env.MAIL_PORT) || 587,

  secure: process.env.MAIL_PORT == 465,

  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

//       VERIFY MAIL CONNECTION

export const verifyMailConnection = async () => {
  try {
    await transporter.verify();

    console.log("Mail Server Connected");
  } catch (error) {
    console.error("Mail Server Connection Failed");
    console.error(error.message);
  }
};

//       SEND MAIL FUNCTION

export const sendMail = async ({
  to,
  subject,
  html,
  text = "",
  attachments = [],
}) => {
  return await transporter.sendMail({
    from: `"ShopSphere" <${process.env.MAIL_USER}>`,

    to,

    subject,

    text,

    html,

    attachments,
  });
};

export default transporter;
