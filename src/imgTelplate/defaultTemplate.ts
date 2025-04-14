import type { ImgTemplate } from '../imgTemplateManager';
import type { SettingsManager } from '../settings/settings';
import { Notice } from 'obsidian';

export class DefaultTemplate implements ImgTemplate {
    id = 'default';
    name = '默认模板';
    sections = {
        header: true,
        content: true as const,
        footer: true
    };

    constructor(
        private settingsManager: SettingsManager,
        private onSettingsUpdate: () => Promise<void>
    ) {}

    render(element: HTMLElement) {
        const sections = element.querySelectorAll('.red-content-section');
        sections.forEach(section => {
            // 获取已有的头部和页脚元素
            const header = element.querySelector('.red-preview-header');
            const footer = element.querySelector('.red-preview-footer');

            // 更新头部内容
            if (this.sections.header && header) {
                this.createHeaderContent(header as HTMLElement);
            }

            // 页脚内容
            if (this.sections.footer && footer) {
                this.createFooterContent(footer as HTMLElement);
            }
        });
    }

    private createHeaderContent(headerArea: HTMLElement) {
        headerArea.empty();
        const settings = this.settingsManager.getSettings();
        const userInfo = this.createUserInfoContainer(headerArea);
        
        this.createUserLeftSection(userInfo, settings);

        if (settings.showTime) {
            this.createTimeSection(userInfo, settings);
        }
    }

    private createUserInfoContainer(parent: HTMLElement): HTMLElement {
        return parent.createEl('div', { cls: 'red-user-info' });
    }

    private createUserLeftSection(parent: HTMLElement, settings: any): HTMLElement {
        const userLeft = parent.createEl('div', { cls: 'red-user-left' });
        this.createAvatarSection(userLeft, settings);
        this.createUserMetaSection(userLeft, settings);
        return userLeft;
    }

    private createAvatarSection(parent: HTMLElement, settings: any) {
        const avatar = parent.createEl('div', {
            cls: 'red-user-avatar',
            attr: { 'title': '点击上传头像' }
        });

        if (settings.userAvatar) {
            avatar.createEl('img', {
                attr: {
                    src: settings.userAvatar,
                    alt: '用户头像'
                }
            });
        } else {
            const placeholder = avatar.createEl('div', { cls: 'red-avatar-placeholder' });
            placeholder.createEl('span', {
                cls: 'red-avatar-upload-icon',
                text: '📷'
            });
        }

        avatar.addEventListener('click', () => this.handleAvatarClick());
    }

    private createUserMetaSection(parent: HTMLElement, settings: any) {
        const userMeta = parent.createEl('div', { cls: 'red-user-meta' });
        
        const userNameContainer = userMeta.createEl('div', { cls: 'red-user-name-container' });
        const userName = userNameContainer.createEl('div', {
            cls: 'red-user-name',
            text: settings.userName,
            attr: { 'title': '点击编辑用户名' }
        });
        userNameContainer.createEl('div', {
            cls: 'red-verified-icon',
            text: '✓'
        });
        
        const userId = userMeta.createEl('div', {
            cls: 'red-user-id',
            text: settings.userId,
            attr: { 'title': '点击编辑用户ID' }
        });

        userName.addEventListener('click', () => this.handleUserNameEdit(userName));
        userId.addEventListener('click', () => this.handleUserIdEdit(userId));
    }

    private createTimeSection(parent: HTMLElement, settings: any) {
        const userRight = parent.createEl('div', { cls: 'red-user-right' });
        userRight.createEl('div', {
            cls: 'red-post-time',
            text: new Date().toLocaleDateString(settings.timeFormat)
        });
    }

    private createFooterContent(footerArea: HTMLElement) {
        footerArea.empty();
        const settings = this.settingsManager.getSettings();

        const leftText = this.createFooterText(footerArea, settings.footerLeftText);
        
        footerArea.createEl('div', {
            cls: 'red-footer-separator',
            text: '|'
        });

        const rightText = this.createFooterText(footerArea, settings.footerRightText);

        leftText.addEventListener('click', () => this.handleFooterTextEdit(leftText, 'left'));
        rightText.addEventListener('click', () => this.handleFooterTextEdit(rightText, 'right'));
    }

    private createFooterText(parent: HTMLElement, text: string): HTMLElement {
        return parent.createEl('div', {
            cls: 'red-footer-text',
            text: text,
            attr: { 'title': '点击编辑文本' }
        });
    }

    private async handleAvatarClick() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';

        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (file) {
                try {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const base64 = e.target?.result as string;
                        await this.settingsManager.updateSettings({
                            userAvatar: base64
                        });
                        await this.onSettingsUpdate();
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('头像更新失败:', error);
                    new Notice('头像更新失败');
                }
            }
        });

        input.click();
    }

    private async handleUserNameEdit(element: HTMLElement) {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-user-edit-input';
        input.placeholder = '请输入用户名';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newName = input.value.trim();
            await this.settingsManager.updateSettings({
                userName: newName || '夜半'
            });
            await this.onSettingsUpdate();
            input.replaceWith(element);
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleBlur();
            }
        });
    }

    private async handleUserIdEdit(element: HTMLElement) {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-user-edit-input';
        input.placeholder = '请输入用户ID';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newId = input.value.trim();
            await this.settingsManager.updateSettings({
                userId: newId || '@Yeban'
            });
            await this.onSettingsUpdate();
            input.replaceWith(element);
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleBlur();
            }
        });
    }

    private async handleFooterTextEdit(element: HTMLElement, position: 'left' | 'right') {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-footer-edit-input';
        input.placeholder = '请输入页脚文本';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newText = input.value.trim();
            const settings = position === 'left' 
                ? { footerLeftText: newText || '夜半过后，光明便启程' }
                : { footerRightText: newText || '欢迎关注公众号：夜半' };
            
            await this.settingsManager.updateSettings(settings);
            await this.onSettingsUpdate();
            input.replaceWith(element);
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleBlur();
            }
        });
    }
}