import { createHash, randomBytes } from "node:crypto";

export class FeishuJSSDK {
  constructor(config) {
    this.config = config;
    this.tenantToken = null;
    this.ticket = null;
  }

  ensureConfigured() {
    if (!this.config.feishuAppId || !this.config.feishuAppSecret) {
      throw new Error("FEISHU_APP_ID and FEISHU_APP_SECRET are required");
    }
  }

  async fetchJson(url, options) {
    const response = await fetch(url, options);
    const payload = await response.json();
    if (!response.ok || payload.code !== 0) {
      throw new Error(
        payload.msg || `Feishu API returned HTTP ${response.status}`,
      );
    }
    return payload;
  }

  async getTenantToken() {
    this.ensureConfigured();
    const now = Date.now();
    if (this.tenantToken && this.tenantToken.expiresAt > now + 60_000) {
      return this.tenantToken.value;
    }
    const payload = await this.fetchJson(
      `${this.config.feishuBaseUrl}/open-apis/auth/v3/tenant_access_token/internal`,
      {
        method: "POST",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          app_id: this.config.feishuAppId,
          app_secret: this.config.feishuAppSecret,
        }),
      },
    );
    const value =
      payload.tenant_access_token || payload.data?.tenant_access_token;
    const expiresIn = payload.expire || payload.data?.expire || 7_200;
    if (!value) throw new Error("Feishu returned no tenant access token");
    this.tenantToken = {
      value,
      expiresAt: now + expiresIn * 1_000,
    };
    return value;
  }

  async getTicket() {
    const now = Date.now();
    if (this.ticket && this.ticket.expiresAt > now + 60_000) {
      return this.ticket.value;
    }
    const token = await this.getTenantToken();
    const payload = await this.fetchJson(
      `${this.config.feishuBaseUrl}/open-apis/jssdk/ticket/get`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json; charset=utf-8",
        },
        body: "{}",
      },
    );
    const value = payload.data?.ticket;
    const expiresIn = payload.data?.expire_in || payload.data?.expire || 7_200;
    if (!value) throw new Error("Feishu returned no JSAPI ticket");
    this.ticket = {
      value,
      expiresAt: now + expiresIn * 1_000,
    };
    return value;
  }

  validatePageUrl(pageUrl) {
    const url = new URL(pageUrl);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("page URL must use HTTP or HTTPS");
    }
    if (
      this.config.publicOrigin &&
      url.origin !== new URL(this.config.publicOrigin).origin
    ) {
      throw new Error("page URL is outside HIT_SEND_PUBLIC_ORIGIN");
    }
    url.hash = "";
    return url.toString();
  }

  async sign(pageUrl) {
    const url = this.validatePageUrl(pageUrl);
    const ticket = await this.getTicket();
    const timestamp = Date.now();
    const nonceStr = randomBytes(16).toString("hex");
    const source =
      `jsapi_ticket=${ticket}&noncestr=${nonceStr}` +
      `&timestamp=${timestamp}&url=${url}`;
    const signature = createHash("sha1").update(source).digest("hex");
    return {
      appId: this.config.feishuAppId,
      nonceStr,
      timestamp,
      signature,
    };
  }
}
