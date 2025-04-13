import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import RedPlugin from '../main'; // 修改插件名以匹配类名
import { CreateThemeModal } from './CreateThemeModal';

export class RedSettingTab extends PluginSettingTab {
    plugin: RedPlugin; // 修改插件类型以匹配类名
    private expandedSections: Set<string> = new Set();

    constructor(app: App, plugin: RedPlugin) { // 修改插件类型以匹配类名
        super(app, plugin);
        this.plugin = plugin;
    }

    private createSection(containerEl: HTMLElement, title: string, renderContent: (contentEl: HTMLElement) => void) {
        const section = containerEl.createDiv('settings-section');
        const header = section.createDiv('settings-section-header');
        
        const toggle = header.createSpan('settings-section-toggle');
        setIcon(toggle, 'chevron-right');
        
        header.createEl('h4', { text: title });
        
        const content = section.createDiv('settings-section-content');
        renderContent(content);
        
        header.addEventListener('click', () => {
            const isExpanded = !section.hasClass('is-expanded');
            section.toggleClass('is-expanded', isExpanded);
            setIcon(toggle, isExpanded ? 'chevron-down' : 'chevron-right');
            if (isExpanded) {
                this.expandedSections.add(title);
            } else {
                this.expandedSections.delete(title);
            }
        });
        
        if (this.expandedSections.has(title) || (!containerEl.querySelector('.settings-section'))) {
            section.addClass('is-expanded');
            setIcon(toggle, 'chevron-down');
            this.expandedSections.add(title);
        }
        
        return section;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('red-settings');

        containerEl.createEl('h2', { text: 'Note to RED 设置' });

        this.createSection(containerEl, '基本设置', el => this.renderBasicSettings(el));
        this.createSection(containerEl, '主题设置', el => this.renderThemeSettings(el));
    }

    private renderThemeSettings(containerEl: HTMLElement): void {    
        // 主题管理区域
        const themeList = containerEl.createDiv('theme-management');
        // 渲染自定义主题
        themeList.createEl('h4', { text: '自定义主题', cls: 'theme-custom-header' });
        this.plugin.settingsManager.getAllThemes()
            .filter(theme => !theme.isPreset)
            .forEach(theme => {
                const themeItem = themeList.createDiv('theme-item');
                new Setting(themeItem)
                    .setName(theme.name)
                    .setDesc(theme.description)
                    .addExtraButton(btn => 
                        btn.setIcon('pencil')
                            .setTooltip('编辑')
                            .onClick(() => {
                                new CreateThemeModal(
                                    this.app,
                                    (updatedTheme) => {
                                        this.plugin.settingsManager.updateTheme(theme.id, updatedTheme);
                                        this.display();
                                    },
                                    theme
                                ).open();
                            }))
                    .addExtraButton(btn => 
                        btn.setIcon('trash')
                            .setTooltip('删除')
                            .onClick(async () => {
                                
                                await this.plugin.settingsManager.removeTheme(theme.id);
                                this.display();
                            }));
            });
    
        // 添加新主题按钮
        new Setting(containerEl)
            .addButton(btn => btn
                .setButtonText('+ 新建主题')
                .setCta()
                .onClick(() => {
                    new CreateThemeModal(
                        this.app,
                        async (newTheme) => {
                            await this.plugin.settingsManager.addCustomTheme(newTheme);
                            this.display(); // 改为调用 display 刷新整个设置界面
                        }
                    ).open();
                }));
    }

    private renderBasicSettings(containerEl: HTMLElement): void {
        // 基本设置的具体实现
    }
}