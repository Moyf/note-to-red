interface RedSettings {
    templateId: string;
    fontFamily: string;
    fontSize: number;
    backgroundId: string;
    // 添加用户信息设置
    userAvatar: string;
    userName: string;
    userId: string;
    showTime: boolean;
    timeFormat: string;
    footerLeftText: string;
    footerRightText: string;
}

const DEFAULT_SETTINGS: RedSettings = {
    templateId: 'default',
    fontFamily: 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC"',
    fontSize: 16,
    backgroundId: '',
    // 修改默认用户信息
    userAvatar: '',  // 默认为空，提示用户上传
    userName: '夜半',
    userId: '@Yeban',
    showTime: true,
    timeFormat: 'zh-CN',
    footerLeftText: '夜半过后，光明便启程',
    footerRightText: '欢迎关注公众号：夜半'
    
}

export class SettingsManager {
    private plugin: any;
    private settings: RedSettings;

    constructor(plugin: any) {
        this.plugin = plugin;
        this.settings = DEFAULT_SETTINGS;
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.plugin.loadData());
    }

    async saveSettings() {
        await this.plugin.saveData(this.settings);
    }

    getSettings(): RedSettings {
        return this.settings;
    }

    async updateSettings(settings: Partial<RedSettings>) {
        this.settings = { ...this.settings, ...settings };
        await this.saveSettings();
    }
}
