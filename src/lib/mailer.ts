import nodemailer from 'nodemailer';

type MailerType = {
  to: string
  subject: string
  text: string
  html?: string
}

export const sendMail = async (data: MailerType) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.NODEMAILER_USER, // Your email address
      pass: process.env.NODEMAILER_PASS, // Your Google App Password or account password if less secure apps is enabled
    },
  });

  try {
    const res = await transporter.sendMail({
      from: `Waste Tracker <${process.env.NODEMAILER_USER}>`,
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html
    })

    return res
  } catch (error) {
    return error
  }
}

export const sendVerifyEmail = async (to: string, token: string,) => {
  const html = `
    <div>
        <h3>WASTE TRACKER SYSTEM</h3>
        <h3>Verification Code</h3>
        <p>Enter the following verification code when prompted:</p>
        <h1>${token}</h1>
        <p>To protect your account, do not share this code.</p>
        <p>Didn't request this?<br>This code was generated for this email during signup at ${process.env.BASE_URL}. If you didn't make this request, you can safely ignore this email.</p>
    </div>`

  const payload: MailerType = {
    to: to,
    subject: `${token} is your verification code`,
    text: `${token} is your verification code`,
    html: html
  }
  return await sendMail(payload)
}