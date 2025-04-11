import type { SettingsManager } from './settings';
import type { ThemeManager } from './themeManager';

interface PreviewHandlers {
    onAvatarClick: () => void;
    onUserNameEdit: (el: HTMLElement) => void;
    onUserIdEdit: (el: HTMLElement) => void;
    onFooterTextEdit: (el: HTMLElement, position: 'left' | 'right') => void;
    onNavigate: (direction: 'prev' | 'next') => void;
}

interface NavigationButtons {
    prev: HTMLButtonElement;
    next: HTMLButtonElement;
    indicator: HTMLElement;
}

export class PreviewManager {
    constructor(private settingsManager: SettingsManager) {}

    // #region 预览内容更新
    async updatePreviewContent(
        previewEl: HTMLElement,
        themeManager: ThemeManager,
        currentImageIndex: number,
        handlers: PreviewHandlers
    ): Promise<NavigationButtons | undefined> {
        // 更新页头
        const header = previewEl.querySelector('.red-preview-header');
        if (header) {
            this.createHeaderContent(
                header as HTMLElement,
                handlers.onAvatarClick,
                handlers.onUserNameEdit,
                handlers.onUserIdEdit
            );
        }

        // 更新页脚
        const footer = previewEl.querySelector('.red-preview-footer');
        if (footer) {
            this.createFooterContent(
                footer as HTMLElement,
                handlers.onFooterTextEdit
            );
        }

        // 应用主题
        themeManager.applyTheme(previewEl);

        // 处理分页导航
        return this.setupNavigation(previewEl, currentImageIndex, handlers.onNavigate);
    }
    // #endregion

    // #region 页头组件
    private createHeaderContent(
        headerArea: HTMLElement,
        handleAvatarClick: () => void,
        handleUserNameEdit: (el: HTMLElement) => void,
        handleUserIdEdit: (el: HTMLElement) => void
    ): void {
        headerArea.empty();
        const settings = this.settingsManager.getSettings();
        const userInfo = this.createUserInfoContainer(headerArea);
        
        const userLeft = this.createUserLeftSection(userInfo, settings, {
            handleAvatarClick,
            handleUserNameEdit,
            handleUserIdEdit
        });

        if (settings.showTime) {
            this.createTimeSection(userInfo, settings);
        }
    }

    private createUserInfoContainer(parent: HTMLElement): HTMLElement {
        return parent.createEl('div', { cls: 'red-user-info' });
    }

    private createUserLeftSection(
        parent: HTMLElement,
        settings: any,
        handlers: {
            handleAvatarClick: () => void,
            handleUserNameEdit: (el: HTMLElement) => void,
            handleUserIdEdit: (el: HTMLElement) => void
        }
    ): HTMLElement {
        const userLeft = parent.createEl('div', { cls: 'red-user-left' });
        
        // 创建头像
        this.createAvatarSection(userLeft, settings, handlers.handleAvatarClick);
        
        // 创建用户信息
        this.createUserMetaSection(userLeft, settings, handlers);
        
        return userLeft;
    }

    private createAvatarSection(parent: HTMLElement, settings: any, handleClick: () => void): void {
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

        avatar.addEventListener('click', handleClick);
    }

    private createUserMetaSection(
        parent: HTMLElement,
        settings: any,
        handlers: {
            handleUserNameEdit: (el: HTMLElement) => void,
            handleUserIdEdit: (el: HTMLElement) => void
        }
    ): void {
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
        userName.addEventListener('click', () => handlers.handleUserNameEdit(userName));
        userId.addEventListener('click', () => handlers.handleUserIdEdit(userId));
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
    private createFooterContent(
        footerArea: HTMLElement,
        handleFooterTextEdit: (el: HTMLElement, position: 'left' | 'right') => void
    ): void {
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
        leftText.addEventListener('click', () => handleFooterTextEdit(leftText, 'left'));
        rightText.addEventListener('click', () => handleFooterTextEdit(rightText, 'right'));
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
    private setupNavigation(
        previewEl: HTMLElement,
        currentImageIndex: number,
        onNavigate: (direction: 'prev' | 'next') => void
    ): NavigationButtons | undefined {
        const sections = previewEl.querySelectorAll('.red-content-section');
        if (sections.length > 0) {
            const navigationButtons = this.createNavigationButtons(
                previewEl,
                sections.length,
                onNavigate
            );
            this.showImage(currentImageIndex, sections, navigationButtons);
            return navigationButtons;
        }
        return undefined;
    }

    private createNavigationButtons(
        container: HTMLElement,
        totalImages: number,
        onNavigate: (direction: 'prev' | 'next') => void
    ): NavigationButtons | undefined {
        const previewContainer = container.querySelector('.red-preview-container');
        if (!previewContainer) return;

        const navContainer = previewContainer.createEl('div', { cls: 'red-nav-container' });
        
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

        prevButton.addEventListener('click', () => onNavigate('prev'));
        nextButton.addEventListener('click', () => onNavigate('next'));

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
}