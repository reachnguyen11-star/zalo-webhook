"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zaloConfig = void 0;
const env_config_1 = require("./env.config");
exports.zaloConfig = {
    appId: env_config_1.config.zalo.appId,
    appSecret: env_config_1.config.zalo.appSecret,
    webhookSecret: env_config_1.config.zalo.webhookSecret,
    // Zalo API endpoints
    endpoints: {
        token: 'https://oauth.zaloapp.com/v4/access_token',
        formData: 'https://business.openapi.zalo.me/oa/v1/form/getdata',
    },
};
//# sourceMappingURL=zalo-config.js.map