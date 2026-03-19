import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "1bis.solutions.tech@gmail.com",
    pass: "gtsz qmzf iowk wwxx",
  },
});
