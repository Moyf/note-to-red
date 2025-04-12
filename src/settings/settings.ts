import { Theme } from '../themeManager';

interface RedSettings {
    templateId: string;
    themeId: string;
    fontFamily: string;
    fontSize: number;
    backgroundId: string;
    themes: Theme[];      // 添加主题列表
    customThemes: Theme[]; // 添加自定义主题列表
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
    themeId: 'light',
    fontFamily: 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC"',
    fontSize: 16,
    backgroundId: '',
    themes: [],
    customThemes: [],
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
        const savedData = await this.plugin.loadData();
        
        // 如果是首次加载或 themes 为空，导入预设主题
        if (!savedData?.themes || savedData.themes.length === 0) {
            const { templates } = await import('../templates');
            savedData.themes = Object.values(templates).map(theme => ({
                ...theme,
                isPreset: true
            }));
        }
        
        // 确保 customThemes 存在
        if (!savedData.customThemes) {
            savedData.customThemes = [];
        }
        
        this.settings = Object.assign({}, DEFAULT_SETTINGS, savedData);
    }

    // 主题相关方法
    getAllThemes(): Theme[] {
        return [...this.settings.themes, ...this.settings.customThemes];
    }

    getTheme(themeId: string): Theme | undefined {
        return this.settings.themes.find(theme => theme.id === themeId) 
            || this.settings.customThemes.find(theme => theme.id === themeId);
    }

    async addCustomTheme(theme: Theme) {
        theme.isPreset = false;
        this.settings.customThemes.push(theme);
        await this.saveSettings();
    }

    async updateTheme(themeId: string, updatedTheme: Partial<Theme>) {
        const theme = this.getTheme(themeId);
        if (theme && !theme.isPreset) {
            const index = this.settings.customThemes.findIndex(t => t.id === themeId);
            if (index !== -1) {
                this.settings.customThemes[index] = {
                    ...this.settings.customThemes[index],
                    ...updatedTheme
                };
                await this.saveSettings();
                return true;
            }
        }
        return false;
    }

    async removeTheme(themeId: string): Promise<boolean> {
        const theme = this.getTheme(themeId);
        if (theme && !theme.isPreset) {
            this.settings.customThemes = this.settings.customThemes.filter(t => t.id !== themeId);
            if (this.settings.themeId === themeId) {
                this.settings.themeId = 'default';
            }
            await this.saveSettings();
            return true;
        }
        return false;
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
