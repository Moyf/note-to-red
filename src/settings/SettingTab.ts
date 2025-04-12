import { App, PluginSettingTab, Setting, setIcon } from 'obsidian';
import RedPlugin from '../main';
import { Theme } from '../themeManager';
import { CreateThemeModal } from './CreateThemeModal';

export class RedSettingTab extends PluginSettingTab {
    plugin: RedPlugin;
    private expandedSections: Set<string> = new Set();

    constructor(app: App, plugin: RedPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    private createSection(containerEl: HTMLElement, title: string, renderContent: (contentEl: HTMLElement) => void) {
        const section = containerEl.createDiv('red-settings-section');
        const header = section.createDiv('red-settings-section-header');
        
        const toggle = header.createSpan('red-settings-section-toggle');
        setIcon(toggle, 'chevron-right');
        
        header.createEl('h4', { text: title });
        
        const content = section.createDiv('red-settings-section-content');
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
        
        if (this.expandedSections.has(title) || (!containerEl.querySelector('.red-settings-section'))) {
            section.addClass('is-expanded');
            setIcon(toggle, 'chevron-down');
            this.expandedSections.add(title);
        }
        
        return section;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.addClass('red-settings-container');

        containerEl.createEl('h2', { text: 'Note to RED 设置' });

        this.createSection(containerEl, '主题管理', (contentEl) => {
            const themeList = contentEl.createDiv('red-theme-list');
            const themes = this.plugin.settingsManager.getAllThemes();
            
            themes.forEach(theme => {
                const themeDiv = themeList.createDiv('red-theme-item');
                new Setting(themeDiv)
                    .setName(theme.name)
                    .setDesc(theme.isPreset ? '(预设)' : '')
                    .addButton(btn => !theme.isPreset && btn
                        .setIcon('pencil')
                        .setTooltip('编辑')
                        .onClick(() => {
                            const fullTheme = {
                                ...theme,
                                styles: theme.styles || {} // 确保 styles 属性存在
                            };
                            new CreateThemeModal(this.app, async (updatedTheme) => {
                                await this.plugin.settingsManager.updateTheme(theme.id, updatedTheme);
                                this.display();
                            }, fullTheme).open();
                        }))
                    .addButton(btn => !theme.isPreset && btn
                        .setIcon('trash')
                        .setTooltip('删除')
                        .onClick(async () => {
                            await this.plugin.settingsManager.removeTheme(theme.id);
                            this.display();
                        }));
            });

            // 添加新主题按钮
            new Setting(contentEl)
                .addButton(btn => btn
                    .setButtonText('添加新主题')
                    .setCta()
                    .onClick(() => {
                        new CreateThemeModal(this.app, (theme) => {
                            this.plugin.settingsManager.addCustomTheme(theme);
                            this.display();
                        }).open();
                    }));
        });
    }
}