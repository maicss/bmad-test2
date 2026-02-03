/**
 * OTP Service Provider Interface and Implementations
 * 
 * 支持多种短信服务提供商：
 * 1. ConsoleMockProvider - 开发模式，验证码输出到控制台
 * 2. AliyunSMSProvider - 阿里云短信服务 (TODO: 需要配置accessKey)
 * 3. TencentSMSProvider - 腾讯云短信服务 (TODO: 需要配置SDK)
 * 
 * 切换服务提供商：
 * 在 .env 文件中设置 OTP_PROVIDER=aliyun|tencent|console
 * 默认为 console（开发模式）
 */

export interface OTPServiceConfig {
  provider: "console" | "aliyun" | "tencent" | "mock";
  // 通用配置
  codeLength?: number;
  expiryMinutes?: number;
  // 阿里云配置
  aliyunAccessKeyId?: string;
  aliyunAccessKeySecret?: string;
  aliyunSignName?: string;
  aliyunTemplateCode?: string;
  // 腾讯云配置
  tencentSecretId?: string;
  tencentSecretKey?: string;
  tencentSmsAppId?: string;
  tencentSignName?: string;
  tencentTemplateId?: string;
}

export interface SendOTPResult {
  success: boolean;
  message: string;
  // 仅开发/测试模式返回
  debugCode?: string;
  // 服务商返回的原始响应
  providerResponse?: unknown;
}

export interface OTPServiceProvider {
  sendSMS(phone: string, code: string): Promise<SendOTPResult>;
  generateCode(): string;
}

/**
 * 开发模式 - 输出到控制台
 */
class ConsoleMockProvider implements OTPServiceProvider {
  generateCode(): string {
    // 开发环境使用固定验证码，方便测试
    return process.env.OTP_DEBUG_CODE || "111111";
  }

  async sendSMS(phone: string, code: string): Promise<SendOTPResult> {
    // 模拟网络延迟
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 输出到控制台
    console.log("\n========================================");
    console.log("📱 OTP短信发送 (开发模式)");
    console.log("========================================");
    console.log(`手机号: ${phone}`);
    console.log(`验证码: ${code}`);
    console.log("========================================\n");

    return {
      success: true,
      message: "验证码已发送（开发模式：查看控制台输出）",
      debugCode: code,
      providerResponse: code,
    };
  }
}

/**
 * 阿里云短信服务占位符
 * 
 * TODO: 集成阿里云短信SDK
 * 文档：https://help.aliyun.com/document_detail/101300.html
 */
class AliyunSMSProvider implements OTPServiceProvider {
  private config: OTPServiceConfig;

  constructor(config: OTPServiceConfig) {
    this.config = config;
  }

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendSMS(phone: string, code: string): Promise<SendOTPResult> {
    // TODO: 实现阿里云短信发送逻辑
    // 1. 初始化阿里云SDK客户端
    // 2. 构建短信请求参数
    // 3. 调用SendSms API
    // 4. 处理响应和错误
    
    console.warn("阿里云短信服务尚未实现，回退到控制台模式");
    
    return {
      success: false,
      message: "阿里云短信服务需要配置: aliyunAccessKeyId, aliyunAccessKeySecret, aliyunSignName, aliyunTemplateCode",
      providerResponse: { status: "NOT_IMPLEMENTED" },
    };
  }
}

/**
 * 腾讯云短信服务占位符
 * 
 * TODO: 集成腾讯云短信SDK
 * 文档：https://cloud.tencent.com/document/product/382/43194
 */
class TencentSMSProvider implements OTPServiceProvider {
  private config: OTPServiceConfig;

  constructor(config: OTPServiceConfig) {
    this.config = config;
  }

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendSMS(phone: string, code: string): Promise<SendOTPResult> {
    // TODO: 实现腾讯云短信发送逻辑
    // 1. 初始化腾讯云SDK客户端
    // 2. 构建SendSms请求
    // 3. 调用短信API
    // 4. 处理响应和错误
    
    console.warn("腾讯云短信服务尚未实现，回退到控制台模式");
    
    return {
      success: false,
      message: "腾讯云短信服务需要配置: tencentSecretId, tencentSecretKey, tencentSmsAppId, tencentSignName, tencentTemplateId",
      providerResponse: { status: "NOT_IMPLEMENTED" },
    };
  }
}

/**
 * OTP服务工厂
 */
export class OTPService {
  private provider: OTPServiceProvider;
  private config: OTPServiceConfig;

  constructor(config?: Partial<OTPServiceConfig>) {
    // 从环境变量或传入的配置构建完整配置
    this.config = {
      provider: (process.env.OTP_PROVIDER as OTPServiceConfig["provider"]) || "console",
      codeLength: 6,
      expiryMinutes: 5,
      // 阿里云配置
      aliyunAccessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      aliyunAccessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      aliyunSignName: process.env.ALIYUN_SMS_SIGN_NAME,
      aliyunTemplateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE,
      // 腾讯云配置
      tencentSecretId: process.env.TENCENT_SECRET_ID,
      tencentSecretKey: process.env.TENCENT_SECRET_KEY,
      tencentSmsAppId: process.env.TENCENT_SMS_APP_ID,
      tencentSignName: process.env.TENCENT_SMS_SIGN_NAME,
      tencentTemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
      // 开发模式配置
      ...config,
    };

    // 根据配置创建对应的provider
    switch (this.config.provider) {
      case "aliyun":
        this.provider = new AliyunSMSProvider(this.config);
        break;
      case "tencent":
        this.provider = new TencentSMSProvider(this.config);
        break;
      case "console":
      case "mock":
      default:
        this.provider = new ConsoleMockProvider();
        break;
    }
  }

  /**
   * 生成验证码
   */
  generateCode(): string {
    return this.provider.generateCode();
  }

  /**
   * 发送验证码短信
   */
  async sendOTP(phone: string): Promise<SendOTPResult> {
    const code = this.generateCode();
    return await this.provider.sendSMS(phone, code);
  }

  /**
   * 获取当前配置
   */
  getConfig(): OTPServiceConfig {
    return { ...this.config };
  }
}

/**
 * 单例实例
 */
let otpServiceInstance: OTPService | null = null;

export function getOTPService(config?: Partial<OTPServiceConfig>): OTPService {
  if (!otpServiceInstance || config) {
    otpServiceInstance = new OTPService(config);
  }
  return otpServiceInstance;
}

/**
 * 重置OTP服务实例（用于测试）
 */
export function resetOTPService(): void {
  otpServiceInstance = null;
}
