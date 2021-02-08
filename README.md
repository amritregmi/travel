# INTRODUCTION #
   App Name - 
      . Travel and Tour- Play APP_RECORDING.mov FIle (User can create an account, book a tour, pay the tour  )

   Technologies Used - 
   
      FRONTEND - VanillaJS, Pug, Mapbox, CSS3, Sass, Payment Services (Stripe), Email Services (MailTrap, SendGrid)
      BACKEND - NodeJs, ExpressJS, MongoDb, RestApi
      PACKAGES - jwt, bcrypt, axios, helmet & express_rate_limit (for security), 
                 sharp(image Processing), multer(file upload), nodemailer (sending emails), 
                 compression (to compress our app before production)
      TESTING - mocha, chai 
      PREPROCESSOR - parcel(for bundling javascript), babel (for ES6 and later), Eslint and prettier (for maintaining code)

### How to Install the app
   ```
   1. $ git clone https://github.com/amritregmi/travel.git
   2. $ cd travel
   1. $ npm install
   2. $ touch config.env
   
      (paste below code and fill up the details in ?)
         NODE_ENV = development
         PORT = 3000
         #mongo db atlas (In DB_LINK => replace amrit with your username)
         DB_LINK = mongodb+srv://amrit:<password>@cluster0.ua44v.mongodb.net/nature?retryWrites=true&w=majority
         DATABASE_PASSWORD = ?
         #jwt options
         JWT_SECRET_KEY = this.is.a.secret.jwt.key.from
         JWT_EXPIRES_IN = 90d
         JWT_COOKIE_EXPIRES_IN = 90
         #mail trap details 
         MAILTRAP_HOST = smtp.mailtrap.io
         MAILTRAP_PORT = 25 
         MAILTRAP_USERNAME = ?
         MAILTRAP_PASSWORD = ?
         #SendGrid 
         SENDGRID_USERNAME = ?
         SENDGRID_API_KEY = ?
         #Stripe
         STRIPE_SECRET_KEY = ?
         STRIPE_PUBLIC_KEY = ?
         STRIPE_WEBHOOK_SECRET = ?
   ```
 ### How to Run the App 
   ```
      * How to run in development mode?
         $ npm run start:dev
      * How to run in production mode?
         $ npm run start:prod
      * How to run in debug mode?
         $ npm run debug
   ```
## PLEASE CHECK APP_RECORDING.mov (VIDEO FILE )
   `By Amrit Regmi, crazyregmi@gmail.com`
