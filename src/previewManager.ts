import type { SettingsManager } from './settings';
import type { ThemeManager } from './themeManager';
import { Notice } from 'obsidian';

interface NavigationButtons {
    prev: HTMLButtonElement;
    next: HTMLButtonElement;
    indicator: HTMLElement;
}

export class PreviewManager {
    private currentImageIndex: number = 0;
    private navigationButtons: NavigationButtons | undefined;

    constructor(
        private settingsManager: SettingsManager,
        private onSettingsUpdate: () => Promise<void>
    ) {}

    // #region 预览内容更新
    async updatePreviewContent(
        previewEl: HTMLElement,
        themeManager: ThemeManager
    ): Promise<void> {
        // 更新页头
        const header = previewEl.querySelector('.red-preview-header');
        if (header) {
            this.createHeaderContent(header as HTMLElement);
        }

        // 更新页脚
        const footer = previewEl.querySelector('.red-preview-footer');
        if (footer) {
            this.createFooterContent(footer as HTMLElement);
        }

        // 应用主题
        themeManager.applyTheme(previewEl);
    }
    // #endregion

    // #region 页头组件
    private createHeaderContent(headerArea: HTMLElement): void {
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
        
        // 创建头像
        this.createAvatarSection(userLeft, settings);
        
        // 创建用户信息
        this.createUserMetaSection(userLeft, settings);
        
        return userLeft;
    }

    private createAvatarSection(parent: HTMLElement, settings: any): void {
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

    private createUserMetaSection(parent: HTMLElement, settings: any): void {
        const userMeta = parent.createEl('div', { cls: 'red-user-meta' });
        
        // 用户名容器
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
        
        // 用户ID
        const userId = userMeta.createEl('div', {
            cls: 'red-user-id',
            text: settings.userId,
            attr: { 'title': '点击编辑用户ID' }
        });

        // 绑定事件
        userName.addEventListener('click', () => this.handleUserNameEdit(userName));
        userId.addEventListener('click', () => this.handleUserIdEdit(userId));
    }

    private createTimeSection(parent: HTMLElement, settings: any): void {
        const userRight = parent.createEl('div', { cls: 'red-user-right' });
        userRight.createEl('div', {
            cls: 'red-post-time',
            text: new Date().toLocaleDateString(settings.timeFormat)
        });
    }
    // #endregion

    // #region 页脚组件
    private createFooterContent(footerArea: HTMLElement): void {
        footerArea.empty();
        const settings = this.settingsManager.getSettings();

        // 创建左侧文本
        const leftText = this.createFooterText(footerArea, settings.footerLeftText);
        
        // 创建分隔符
        footerArea.createEl('div', {
            cls: 'red-footer-separator',
            text: '|'
        });

        // 创建右侧文本
        const rightText = this.createFooterText(footerArea, settings.footerRightText);

        // 绑定事件
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
    // #endregion

    // #region 导航组件
    private setupNavigation(previewEl: HTMLElement): NavigationButtons | undefined {
        const sections = previewEl.querySelectorAll('.red-content-section');
        if (sections.length > 0) {
            this.navigationButtons = this.createNavigationButtons(previewEl, sections.length);
            this.showImage(this.currentImageIndex, sections, this.navigationButtons);
            return this.navigationButtons;
        }
        return undefined;
    }

    private handleNavigate(direction: 'prev' | 'next') {
        const sections = document.querySelectorAll('.red-content-section');
        if (direction === 'prev' && this.currentImageIndex > 0) {
            this.currentImageIndex--;
        } else if (direction === 'next' && this.currentImageIndex < sections.length - 1) {
            this.currentImageIndex++;
        }
        if (this.navigationButtons) {
            this.showImage(this.currentImageIndex, sections, this.navigationButtons);
        }
    }

    private createNavigationButtons(
        container: HTMLElement,
        totalImages: number
    ): NavigationButtons | undefined {
        const navContainer = container.createEl('div', { cls: 'red-nav-container' });
        
        const prevButton = navContainer.createEl('button', {
            cls: 'red-nav-button',
            text: '←'
        });

        const indicator = navContainer.createEl('span', {
            cls: 'red-page-indicator',
            text: `1/${totalImages}`
        });

        const nextButton = navContainer.createEl('button', {
            cls: 'red-nav-button',
            text: '→'
        });

        prevButton.addEventListener('click', () => this.handleNavigate('prev'));
        nextButton.addEventListener('click', () => this.handleNavigate('next'));

        return { prev: prevButton, next: nextButton, indicator };
    }

    public showImage(
        index: number,
        sections: NodeListOf<Element>,
        navigationButtons?: NavigationButtons
    ): void {
        sections.forEach((section, i) => {
            (section as HTMLElement).classList.toggle('red-section-active', i === index);
        });

        if (navigationButtons) {
            navigationButtons.prev.classList.toggle('red-nav-hidden', index === 0);
            navigationButtons.next.classList.toggle('red-nav-hidden', index === sections.length - 1);
            navigationButtons.indicator.textContent = `${index + 1}/${sections.length}`;
        }
    }
    // #endregion

    // #region 交互处理
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