import { App, Modal } from 'obsidian';
import { ThemeManager } from '../themeManager';

export class ThemePreviewModal extends Modal {
    private theme: any;
    private themeManager: ThemeManager;

    constructor(app: App, theme: any, themeManager: ThemeManager) {
        super(app);
        this.theme = theme;
        this.themeManager = themeManager;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('theme-preview-modal');

        // 添加标题
        contentEl.createEl('h2', { text: `主题预览: ${this.theme.name}`, cls: 'red-theme-title' });

        // 添加预览区域
        const container = contentEl.createDiv('tp-red-preview-container');
        const previewContainer = container.createDiv('red-image-preview');
        
        // 页眉区域
        const header = previewContainer.createDiv('red-preview-header');
        const userInfo = header.createEl('div', { cls: 'red-user-info' });
        const userLeft = userInfo.createEl('div', { cls: 'red-user-left' });
        const avatar = userLeft.createEl('div', { cls: 'red-user-avatar' });
        const placeholder = avatar.createEl('div', { cls: 'red-avatar-placeholder' });
            placeholder.createEl('span', {
                cls: 'red-avatar-upload-icon',
                text: '📷'
            });
        const userMeta = userLeft.createEl('div', { cls: 'red-user-meta' });
        const userNameContainer = userMeta.createEl('div', { cls: 'red-user-name-container' });
        userNameContainer.createEl('div', { cls: 'red-user-name', text: '夜半' });
        userNameContainer.createEl('div', { cls: 'red-verified-icon', text: '✓' });
        userMeta.createEl('div', { cls: 'red-user-id', text: '@Yeban' });
        const userRight = userInfo.createEl('div', { cls: 'red-user-right' });
        userRight.createEl('div', { cls: 'red-post-time', text: '2025/4/20' });

        // 内容区域
        const content = previewContainer.createDiv('red-preview-content');
        
        // 标题样式
        content.createEl('h2', { text: '探索夜半插件的无限可能' });

        // 段落样式
        const paragraph1 = content.createEl('p');
        paragraph1.createEl('span', { text: '插件提供多种' });
        paragraph1.createEl('strong', { text: '优雅的操作，' });
        paragraph1.createEl('span', { text: '助您轻松发布笔记。' });

        // 列表样式
        const list = content.createEl('ul');
        list.createEl('li', { text: '轻松定制主题样式' });
        list.createEl('li', { text: '实时预览主题效果' });

        // 引用样式
        const quote = content.createEl('blockquote');
        quote.createEl('p', { text: '“让笔记发帖变得如此简单。”' });

        // 代码样式
        const codeBlock = content.createEl('pre');
        codeBlock.classList.add('red-pre'); // 添加样式类
        const dots = codeBlock.createDiv('red-code-dots'); // 添加窗口按钮
        ['red', 'yellow', 'green'].forEach(color => {
            dots.createSpan({ cls: `red-code-dot red-code-dot-${color}` });
        });
        codeBlock.createEl('code', { text: 'console.log("欢迎使用夜半插件！");' });

        // 分隔线样式
        content.createEl('hr');

        content.createEl('strong', { text: '如果您觉得我的插件对您有帮助，请打赏支持我。'});

        // 页脚区域
        const footer = previewContainer.createDiv('red-preview-footer');
        footer.createEl('div', { cls: 'red-footer-text', text: '夜半过后，光明便启程'});
        footer.createEl('div', { cls: 'red-footer-separator', text: '|' });
        footer.createEl('div', { cls: 'red-footer-text', text: '欢迎关注公众号🌏：夜半'});

        this.themeManager.applyTheme(container, this.theme);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}