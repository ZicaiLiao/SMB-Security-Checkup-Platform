import { Question } from "@/lib/types";

export const QUESTION_BANK: Question[] = [
  {
    id: "account_mfa",
    domain: "account_access",
    prompt: "管理员账号是否已全面启用多因素认证？",
    description: "重点关注邮箱、云盘、财务和管理后台等高价值账号。",
    type: "single_select",
    weight: 5,
    required: true,
    options: [
      { label: "全部启用", value: "all", score: 100, helpText: "核心账号都已受 MFA 保护。" },
      { label: "部分启用", value: "partial", score: 55, helpText: "只有关键人员启用了 MFA。" },
      { label: "未启用", value: "none", score: 0, helpText: "高风险，账号易被撞库和钓鱼盗取。" }
    ]
  },
  {
    id: "account_offboarding",
    domain: "account_access",
    prompt: "员工离职后，账号和权限的停用流程是否标准化？",
    description: "包括邮箱、SaaS、VPN、代码仓库和文件共享权限。",
    type: "single_select",
    weight: 4,
    required: true,
    options: [
      { label: "24小时内完成", value: "same_day", score: 100, helpText: "离职当天即可完成权限回收。" },
      { label: "偶尔延迟", value: "delay", score: 60, helpText: "流程存在但执行不稳定。" },
      { label: "没有固定流程", value: "manual", score: 10, helpText: "容易遗留高权限账号。" }
    ]
  },
  {
    id: "device_edr",
    domain: "device_baseline",
    prompt: "公司终端设备是否统一安装了杀毒或 EDR 工具？",
    description: "尤其关注财务电脑、老板电脑和开发设备。",
    type: "single_select",
    weight: 4,
    required: true,
    options: [
      { label: "覆盖率超过90%", value: "high", score: 100, helpText: "终端可见性较好。" },
      { label: "覆盖一半左右", value: "mid", score: 60, helpText: "存在明显盲区。" },
      { label: "基本没有", value: "low", score: 5, helpText: "终端防护极弱。" }
    ]
  },
  {
    id: "device_patch",
    domain: "device_baseline",
    prompt: "操作系统和浏览器安全补丁更新是否有固定节奏？",
    description: "至少覆盖 Windows/macOS 和常见浏览器。",
    type: "single_select",
    weight: 4,
    required: true,
    options: [
      { label: "每月统一更新", value: "monthly", score: 100, helpText: "具备稳定补丁节奏。" },
      { label: "有提醒但不统一", value: "ad_hoc", score: 65, helpText: "更新依赖员工自觉。" },
      { label: "几乎不管", value: "rare", score: 10, helpText: "已知漏洞长期暴露。" }
    ]
  },
  {
    id: "email_spoof",
    domain: "email_security",
    prompt: "域名是否已配置 SPF、DKIM、DMARC 等基础邮件防护？",
    description: "面向企业邮箱域名的伪造与冒充防护。",
    type: "single_select",
    weight: 5,
    required: true,
    options: [
      { label: "三项均已配置", value: "all", score: 100, helpText: "伪造邮件风险明显下降。" },
      { label: "已配置部分", value: "partial", score: 60, helpText: "仍存在域名冒用风险。" },
      { label: "不清楚/未配置", value: "none", score: 0, helpText: "钓鱼邮件可信度会很高。" }
    ]
  },
  {
    id: "email_reporting",
    domain: "email_security",
    prompt: "员工是否知道收到可疑邮件后该如何上报？",
    description: "看是否有固定入口、联系人或上报流程。",
    type: "single_select",
    weight: 3,
    required: true,
    options: [
      { label: "流程明确", value: "clear", score: 100, helpText: "员工知道该联系谁和怎么上报。" },
      { label: "部分人知道", value: "partial", score: 55, helpText: "需要进一步培训与统一。" },
      { label: "没有流程", value: "none", score: 10, helpText: "攻击发现和响应会被延误。" }
    ]
  },
  {
    id: "backup_frequency",
    domain: "backup_recovery",
    prompt: "关键业务数据和文件是否有定期备份？",
    description: "包括财务数据、客户资料、设计素材、合同和代码等。",
    type: "single_select",
    weight: 5,
    required: true,
    options: [
      { label: "每日自动备份", value: "daily", score: 100, helpText: "恢复能力较强。" },
      { label: "每周或手工备份", value: "weekly", score: 60, helpText: "恢复窗口偏大。" },
      { label: "几乎没有备份", value: "none", score: 0, helpText: "勒索或误删后恢复困难。" }
    ]
  },
  {
    id: "backup_restore",
    domain: "backup_recovery",
    prompt: "最近 6 个月是否实际做过备份恢复演练？",
    description: "备份存在不代表一定可恢复，演练很关键。",
    type: "single_select",
    weight: 3,
    required: true,
    options: [
      { label: "做过并成功恢复", value: "tested", score: 100, helpText: "备份可靠性有验证。" },
      { label: "做过但不完整", value: "partial", score: 60, helpText: "恢复路径仍有盲点。" },
      { label: "从未演练", value: "never", score: 10, helpText: "真正出事时恢复不确定。" }
    ]
  },
  {
    id: "awareness_training",
    domain: "employee_awareness",
    prompt: "员工是否接受过近 12 个月的网络安全培训？",
    description: "包括密码、钓鱼、数据分享和社工风险。",
    type: "single_select",
    weight: 4,
    required: true,
    options: [
      { label: "全部完成", value: "all", score: 100, helpText: "安全意识基础较好。" },
      { label: "只覆盖部分岗位", value: "partial", score: 55, helpText: "高风险岗位可能遗漏。" },
      { label: "从未系统培训", value: "none", score: 10, helpText: "人为失误概率高。" }
    ]
  },
  {
    id: "awareness_simulation",
    domain: "employee_awareness",
    prompt: "是否做过钓鱼邮件演练或社工演练？",
    description: "看组织是否真正验证员工面对攻击的反应。",
    type: "single_select",
    weight: 3,
    required: true,
    options: [
      { label: "定期演练", value: "regular", score: 100, helpText: "安全文化更容易形成。" },
      { label: "偶尔做过", value: "once", score: 60, helpText: "缺少持续跟进。" },
      { label: "从未做过", value: "never", score: 10, helpText: "真实攻击下容易失守。" }
    ]
  },
  {
    id: "vendor_access",
    domain: "vendor_collaboration",
    prompt: "外包、供应商、兼职成员的系统访问是否有最小权限控制？",
    description: "关注共享账号、共享云盘、共享后台的外部访问。",
    type: "single_select",
    weight: 4,
    required: true,
    options: [
      { label: "最小权限且按需开通", value: "least", score: 100, helpText: "外部协作风险可控。" },
      { label: "大致控制但不规范", value: "partial", score: 55, helpText: "存在权限漂移问题。" },
      { label: "经常共用账号", value: "shared", score: 5, helpText: "很难审计与追责。" }
    ]
  },
  {
    id: "vendor_contract",
    domain: "vendor_collaboration",
    prompt: "供应商合同中是否明确了数据保护和安全责任？",
    description: "尤其适用于代运营、财务代理、设计外包、云服务商。",
    type: "single_select",
    weight: 3,
    required: true,
    options: [
      { label: "合同条款完整", value: "full", score: 100, helpText: "责任边界清晰。" },
      { label: "部分项目有约定", value: "partial", score: 60, helpText: "仍有合作方缺失约束。" },
      { label: "基本没有", value: "none", score: 10, helpText: "数据泄露后的追责困难。" }
    ]
  }
];
