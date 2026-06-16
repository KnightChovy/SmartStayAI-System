import 'dotenv/config';
import Joi from 'joi';

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().description('Mongo DB url (optional, kept for legacy error typing)'),
    DATABASE_URL: Joi.string().required().description('PostgreSQL database URL'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    BCRYPT_ROUNDS: Joi.number().default(12).description('bcrypt salt rounds for password hashing'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    CLIENT_URL: Joi.string().required().description('Frontend URL used to build links in emails'),
    CLOUDINARY_CLOUD_NAME: Joi.string().required().description('Cloudinary cloud name'),
    CLOUDINARY_API_KEY: Joi.string().required().description('Cloudinary API key'),
    CLOUDINARY_API_SECRET: Joi.string().required().description('Cloudinary API secret'),
    PARTNER_DEFAULT_COMMISSION_RATE: Joi.number()
      .default(15)
      .description('default commission rate (%) applied to a newly registered hotel partner'),
    PAYOUT_ENCRYPTION_KEY: Joi.string()
      .required()
      .description('base64-encoded 32-byte key (AES-256-GCM) to encrypt sensitive payout data'),
    VNP_TMN_CODE: Joi.string().allow('').default('').description('VNPay merchant terminal code (TmnCode)'),
    VNP_HASH_SECRET: Joi.string().allow('').default('').description('VNPay HMAC-SHA512 secret'),
    VNP_URL: Joi.string()
      .default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html')
      .description('VNPay payment gateway URL'),
    VNP_API_URL: Joi.string()
      .default('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction')
      .description('VNPay merchant API URL (query/refund)'),
    VNP_RETURN_URL: Joi.string()
      .default('http://localhost:5000/v1/payments/vnpay/return')
      .description('Backend URL VNPay redirects the browser back to after payment'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  clientUrl: envVars.CLIENT_URL,
  mongoose: {
    url: envVars.MONGODB_URL ? envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : '') : undefined,
    options: {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  prisma: {
    url: envVars.DATABASE_URL,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  bcrypt: {
    rounds: envVars.BCRYPT_ROUNDS,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },
  partner: {
    // Tỉ lệ hoa hồng (%) mặc định gán cho đối tác mới khi họ nộp hồ sơ đăng ký
    defaultCommissionRate: envVars.PARTNER_DEFAULT_COMMISSION_RATE,
  },
  security: {
    // Key mã hoá dữ liệu nhạy cảm (số tài khoản nhận tiền của đối tác)
    payoutEncryptionKey: envVars.PAYOUT_ENCRYPTION_KEY,
  },
  vnpay: {
    tmnCode: envVars.VNP_TMN_CODE,
    hashSecret: envVars.VNP_HASH_SECRET,
    url: envVars.VNP_URL,
    apiUrl: envVars.VNP_API_URL,
    returnUrl: envVars.VNP_RETURN_URL,
  },
};

export default config;
