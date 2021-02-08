// helps to create a transport for various mail services 
const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')

/**
 * 
 * @SENDGRID - used for production.
 * @MAILTRAP - is used for dev purpose 
 * @MAILSACK - is used as disposable email. 
 * 
 */

/**
 * @DESC This class helps to send Email 
 * @PARAM1 user: where the email is sent 
 * @PARAM2 url : our app url to add into the mail, like resetUrl, upload photo url
 */
module.exports = class Email {
    constructor(user, url) {
        this.from = `Travel ${process.env.EMAIL_FROM}`
        this.to = user.email
        this.firstName = user.name.split(' ')[0]
        this.url = url
    }
    // creates a transport, mailtrap[dev] & sendGrid[prod]
    getTransport() {
        // sendGrid for production 
        if (process.env.NODE_ENV === 'production') {
            const transporter = nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_API_KEY
                }
            })
            return transporter // returns sendgrid transporter
        }

        // nodemailer transport for dev: 
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            auth: {
                port: process.env.MAILTRAP_PORT,
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD
            }
        })
        return transporter // returns nodemailer transporter 
    }

    /**
     * @DESC calls Email.send() 
     * @PROVIDES template, subject
     * @template is welcome.pug
     * @subject is 'welcome to our App'
     */
    async sendWelcome() {
        await this.send('welcome', 'Welcome to our App')
    }

    /**
     * @DESC calls Email.send() 
     * @PROVIDES template, subject
     * @template is passwordRest.pug
     */
    async sendPassportReset() {
        await this.send('passwordReset', 'Your password reset token valid for 10 mins')
    }
    /**
     * !TODO
     * @DESC calls Email.send() 
     * @PROVIDES template, subject
     * @template is confirmEmail.pug
     */
    async sendConfirmEmail() {
        return 1
    }

    /**
     * @DESC Actual Email is sent via this function.  
     * @param template name 
     * @param subject description 
     */
    async send(template, subject) {
        // convert pug template to html template and fills placeholder with actual data
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
            firstName: this.firstName, // these variable are passed to template
            url: this.url,
            subject,
        })

        // define email options 
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html) // !used new version htmlToText(html)
        }
        // create a transport 
        const transporter = this.getTransport()

        // send email ; sending email is always done via transporter.
        await transporter.sendMail(mailOptions)
    }

}


/**
 * @TODO 
 * ! UNIMPLEMENTED 
 */
const sendEmailUsingGmail = async options => {
    //1. Create a transporter, is same for any service, google,yahoo
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_HOST,
        auth: {
            user: '',
            pass: '',
        }
    })

    //2. Define an email options 
    const mailOptions = {
        from: 'Amrit Regmi <amrit@amrit.com>',
        to: options.email,
        subject: options.subject,
        text: options.message
    }
    //3. Send the email 
    await transporter.sendMail(mailOptions)
}