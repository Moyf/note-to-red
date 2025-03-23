import type { SettingsManager } from './settings';

export class PreviewManager {
    constructor(private settingsManager: SettingsManager) {}

    // 创建页头内容
    createHeaderContent(headerArea: HTMLElement, handleAvatarClick: () => void, 
                       handleUserNameEdit: (el: HTMLElement) => void, 
                       handleUserIdEdit: (el: HTMLElement) => void) {
        headerArea.empty();
        const settings = this.settingsManager.getSettings();
        const userInfo = headerArea.createEl('div', { cls: 'red-user-info' });
        
        // 左侧用户信息区
        const userLeft = userInfo.createEl('div', { cls: 'red-user-left' });
        
        // 用户头像
        const avatar = userLeft.createEl('div', { 
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
            const placeholder = avatar.createEl('div', {
                cls: 'red-avatar-placeholder'
            });
            placeholder.createEl('span', {
                cls: 'red-avatar-upload-icon',
                text: '📷'
            });
        }

        avatar.addEventListener('click', handleAvatarClick);

        // 用户信息区
        const userMeta = userLeft.createEl('div', { cls: 'red-user-meta' });
        
        const userNameContainer = userMeta.createEl('div', {
            cls: 'red-user-name-container'
        });
        
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

        userName.addEventListener('click', () => handleUserNameEdit(userName));
        userId.addEventListener('click', () => handleUserIdEdit(userId));

        if (settings.showTime) {
            const userRight = userInfo.createEl('div', { cls: 'red-user-right' });
            userRight.createEl('div', { 
                cls: 'red-post-time',
                text: new Date().toLocaleDateString(settings.timeFormat)
            });
        }
    }

    // 创建页脚内容
    createFooterContent(footerArea: HTMLElement, handleFooterTextEdit: (el: HTMLElement, position: 'left' | 'right') => void) {
        footerArea.empty();
        const settings = this.settingsManager.getSettings();

        // 直接使用 footerArea，移除多余的容器创建
        // 创建左侧文本
        const leftText = footerArea.createEl('div', {
            cls: 'red-footer-text',
            text: settings.footerLeftText,
            attr: { 'title': '点击编辑文本' }
        });

        // 创建分隔符
        footerArea.createEl('div', {
            cls: 'red-footer-separator',
            text: '|'
        });

        // 创建右侧文本
        const rightText = footerArea.createEl('div', {
            cls: 'red-footer-text',
            text: settings.footerRightText,
            attr: { 'title': '点击编辑文本' }
        });

        // 添加点击编辑事件
        leftText.addEventListener('click', () => handleFooterTextEdit(leftText, 'left'));
        rightText.addEventListener('click', () => handleFooterTextEdit(rightText, 'right'));
    }

    // 创建导航按钮
    createNavigationButtons(container: HTMLElement, totalImages: number, onNavigate: (direction: 'prev' | 'next') => void) {
        const previewContainer = container.querySelector('.red-preview-container');
        if (!previewContainer) return;
    
        const navContainer = previewContainer.createEl('div', { 
            cls: 'red-nav-container'
        });
    
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
    
        // 添加导航事件
        prevButton.addEventListener('click', () => onNavigate('prev'));
        nextButton.addEventListener('click', () => onNavigate('next'));
    
        return { prev: prevButton, next: nextButton, indicator };
    }

    // 显示指定索引的图片
    showImage(index: number, sections: NodeListOf<Element>, navigationButtons?: {
        prev: HTMLButtonElement;
        next: HTMLButtonElement;
        indicator: HTMLElement;
    }) {
        sections.forEach((section, i) => {
            (section as HTMLElement).classList.toggle('red-section-active', i === index);
        });

        if (navigationButtons) {
            navigationButtons.prev.classList.toggle('red-nav-hidden', index === 0);
            navigationButtons.next.classList.toggle('red-nav-hidden', index === sections.length - 1);
            navigationButtons.indicator.textContent = `${index + 1}/${sections.length}`;
        }
    }
}