interface EnvConfig {
    port: number;
    nodeEnv: string;
    adminPassword: string;
    zalo: {
        appId: string;
        appSecret: string;
        webhookSecret: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
    };
    spreadsheetId: string;
    logLevel: string;
}
export declare const config: EnvConfig;
export {};
//# sourceMappingURL=env.config.d.ts.map