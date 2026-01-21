import { config } from './env.config';

export const zaloConfig = {
  appId: config.zalo.appId,
  appSecret: config.zalo.appSecret,
  webhookSecret: config.zalo.webhookSecret,

  // Zalo API endpoints
  endpoints: {
    token: 'https://oauth.zaloapp.com/v4/access_token',
    formData: 'https://business.openapi.zalo.me/oa/v1/form/getdata',
  },
};
