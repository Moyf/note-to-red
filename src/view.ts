import { ItemView, WorkspaceLeaf, MarkdownRenderer, TFile } from 'obsidian';
import { RedConverter } from './converter';
import { DownloadManager } from './downloadManager';
import type { TemplateManager } from './templateManager';
import { DonateManager } from './donateManager';
import type { SettingsManager } from './settings';
import { PreviewManager } from './previewManager';
export const VIEW_TYPE_RED = 'note-to-red';

export class RedView extends ItemView {
    private previewEl: HTMLElement;
    private currentFile: TFile | null = null;
    private updateTimer: NodeJS.Timeout | null = null;
    private isPreviewLocked: boolean = false;
    private lockButton: HTMLButtonElement;
    private copyButton: HTMLButtonElement;
    private templateManager: TemplateManager;
    private settingsManager: SettingsManager;
    private customTemplateSelect: HTMLElement;
    private customFontSelect: HTMLElement;
    private fontSizeSelect: HTMLInputElement;
    private customBackgroundSelect: HTMLElement;
    private currentImageIndex: number = 0;
    private navigationButtons: {
        prev: HTMLButtonElement;
        next: HTMLButtonElement;
        indicator: HTMLElement;
    } | undefined;
    private previewManager: PreviewManager;

    constructor(
        leaf: WorkspaceLeaf, 
        templateManager: TemplateManager,
        settingsManager: SettingsManager
    ) {
        super(leaf);
        this.templateManager = templateManager;
        this.settingsManager = settingsManager;
        this.previewManager = new PreviewManager(settingsManager);
    }

    getViewType() {
        return VIEW_TYPE_RED;
    }

    getDisplayText() {
        return '小红书预览';
    }

    getIcon() {
       return 'image';
    }

    async onOpen() {
        const container = this.containerEl.children[1];
        container.empty();
        container.className = 'red-view-content';
        
        const toolbar = container.createEl('div', { cls: 'red-toolbar' });

        // 锁定按钮
        this.lockButton = toolbar.createEl('button', {
            cls: 'red-lock-button',
            text: '🔓',
            attr: { 'aria-label': '关闭实时预览状态' }
        });
        this.lockButton.addEventListener('click', () => this.togglePreviewLock());
    
        // 创建中间控件容器
        const controlsGroup = toolbar.createEl('div', { cls: 'red-controls-group' });
        
        // 创建自定义下拉选择器
        this.customTemplateSelect = this.createCustomSelect(
            controlsGroup,
            'red-template-select',
            await this.getTemplateOptions()
        );
        this.customTemplateSelect.id = 'template-select';
        
        // 添加模板选择器的 change 事件监听
        this.customTemplateSelect.querySelector('.red-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            this.templateManager.setCurrentTemplate(value);
            await this.settingsManager.updateSettings({
                templateId: value
            });
            this.templateManager.applyTemplate(this.previewEl);
        });
    
        this.customFontSelect = this.createCustomSelect(
            controlsGroup,
            'red-font-select',
            this.getFontOptions()
        );

        // 添加字体选择器的 change 事件监听
        this.customFontSelect.querySelector('.red-select')?.addEventListener('change', async (e: any) => {
            const value = e.detail.value;
            this.templateManager.setFont(value);
            await this.settingsManager.updateSettings({
                fontFamily: value
            });
            this.templateManager.applyTemplate(this.previewEl);
        });
        this.customFontSelect.id = 'font-select';

        // 字号调整
        const fontSizeGroup = controlsGroup.createEl('div', { cls: 'red-font-size-group' });
        const decreaseButton = fontSizeGroup.createEl('button', { 
            cls: 'red-font-size-btn',
            text: '-'
        });
        this.fontSizeSelect = fontSizeGroup.createEl('input', { 
            cls: 'red-font-size-input',
            type: 'text',
            value: '16',
            attr: {
                style: 'border: none; outline: none; background: transparent;'
            }
        });
        const increaseButton = fontSizeGroup.createEl('button', { 
            cls: 'red-font-size-btn',
            text: '+'
        });

        // 从设置中恢复上次的选择
        const settings = this.settingsManager.getSettings();

        // 恢复设置
        if (settings.templateId) {
            const templateSelect = this.customTemplateSelect.querySelector('.red-select-text');
            const templateDropdown = this.customTemplateSelect.querySelector('.red-select-dropdown');
            if (templateSelect && templateDropdown) {
                const option = await this.getTemplateOptions();
                const selected = option.find(o => o.value === settings.templateId);
                if (selected) {
                    // 更新选中文本和值
                    templateSelect.textContent = selected.label;
                    this.customTemplateSelect.querySelector('.red-select')?.setAttribute('data-value', selected.value);
                    // 更新下拉列表中的选中状态
                    templateDropdown.querySelectorAll('.red-select-item').forEach(el => {
                        if (el.getAttribute('data-value') === selected.value) {
                            el.classList.add('red-selected');
                        } else {
                            el.classList.remove('red-selected');
                        }
                    });
                }
            }
            this.templateManager.setCurrentTemplate(settings.templateId);
        }

        if (settings.fontFamily) {
            const fontSelect = this.customFontSelect.querySelector('.red-select-text');
            const fontDropdown = this.customFontSelect.querySelector('.red-select-dropdown');
            if (fontSelect && fontDropdown) {
                const option = this.getFontOptions();
                const selected = option.find(o => o.value === settings.fontFamily);
                if (selected) {
                    // 更新选中文本和值
                    fontSelect.textContent = selected.label;
                    this.customFontSelect.querySelector('.red-select')?.setAttribute('data-value', selected.value);
                    // 更新下拉列表中的选中状态
                    fontDropdown.querySelectorAll('.red-select-item').forEach(el => {
                        if (el.getAttribute('data-value') === selected.value) {
                            el.classList.add('red-selected');
                        } else {
                            el.classList.remove('red-selected');
                        }
                    });
                }
            }
            this.templateManager.setFont(settings.fontFamily);
        }

        if (settings.fontSize) {
            this.fontSizeSelect.value = settings.fontSize.toString();
            this.templateManager.setFontSize(settings.fontSize);
        }

        // 更新字号调整事件
        const updateFontSize = async () => {
            const size = parseInt(this.fontSizeSelect.value);
            this.templateManager.setFontSize(size);
            await this.settingsManager.updateSettings({
                fontSize: size
            });
            this.templateManager.applyTemplate(this.previewEl);
        };

        // 字号调整按钮事件
        decreaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize > 12) {
                this.fontSizeSelect.value = (currentSize - 1).toString();
                updateFontSize();
            }
        });

        increaseButton.addEventListener('click', () => {
            const currentSize = parseInt(this.fontSizeSelect.value);
            if (currentSize < 30) {
                this.fontSizeSelect.value = (currentSize + 1).toString();
                updateFontSize();
            }
        });

        this.fontSizeSelect.addEventListener('change', updateFontSize);

        // 预览区域
        this.previewEl = container.createEl('div', { cls: 'red-preview-wrapper' });

        // 底部工具栏
        const bottomBar = container.createEl('div', { cls: 'red-bottom-bar' });

        // 帮助按钮
        const helpButton = bottomBar.createEl('button', {
            cls: 'red-help-button',
            text: '❓',
            attr: { 'aria-label': '使用指南' }
        });
        
        // 更新帮助文本
        const tooltip = bottomBar.createEl('div', {
            cls: 'red-help-tooltip',
            text: `使用指南：
                1. 核心用法：用二级标题(##)分割内容，每个标题生成一张小红书配图
                2. 首图制作：单独调整首节字号至20-24px，使用【下载当前页】导出
                3. 长文优化：内容较多的章节可调小字号至14-16px后单独导出
                4. 批量操作：保持统一字号时，用【导出全部页】批量生成
                5. 模板切换：顶部选择器可切换不同视觉风格
                6. 实时编辑：解锁状态(🔓)下编辑文档即时预览效果
                7. 支持创作：点击❤️关于作者可进行打赏支持`
        });

        // 创建中间控件容器
        const bottomControlsGroup = bottomBar.createEl('div', { cls: 'red-bottom-controls-group' });
        
        // 请作者喝咖啡按钮
        const likeButton = bottomControlsGroup.createEl('button', { 
            cls: 'red-like-button'
        });
        const heartSpan = likeButton.createEl('span', {
            text: '❤️',
            attr: { style: 'margin-right: 4px' }
        });
        likeButton.createSpan({ text: '关于作者' });
        likeButton.addEventListener('click', () => {
            DonateManager.showDonateModal(this.containerEl);
        });

        // 单张下载按钮
        const singleDownloadButton = bottomControlsGroup.createEl('button', {
            text: '下载当前页',
            cls: 'red-export-button'
        });

        singleDownloadButton.addEventListener('click', async () => {
            if (this.previewEl) {
                singleDownloadButton.disabled = true;
                singleDownloadButton.setText('导出中...');
                
                try {
                    await DownloadManager.downloadSingleImage(this.previewEl);
                    singleDownloadButton.setText('导出成功');
                    
                    setTimeout(() => {
                        singleDownloadButton.disabled = false;
                        singleDownloadButton.setText('下载当前页');
                    }, 2000);
                } catch (error) {
                    singleDownloadButton.setText('导出失败');
                    setTimeout(() => {
                        singleDownloadButton.disabled = false;
                        singleDownloadButton.setText('下载当前页');
                    }, 2000);
                }
            }
        });

        // 更新按钮文本和类名
        this.copyButton = bottomControlsGroup.createEl('button', { 
            text: '导出全部页',
            cls: 'red-export-button'
        });
        
        // 添加导出按钮点击事件
        this.copyButton.addEventListener('click', async () => {
            if (this.previewEl) {
                this.copyButton.disabled = true;
                this.copyButton.setText('导出中...');
                
                try {
                    await DownloadManager.downloadAllImages(this.previewEl);
                    this.copyButton.setText('导出成功');
                    
                    setTimeout(() => {
                        this.copyButton.disabled = false;
                        this.copyButton.setText('导出全部页');
                    }, 2000);
                } catch (error) {
                    this.copyButton.setText('导出失败');
                    setTimeout(() => {
                        this.copyButton.disabled = false;
                        this.copyButton.setText('导出全部页');
                    }, 2000);
                }
            }
        });

        const newButton = bottomControlsGroup.createEl('button', { 
            text: '敬请期待',
            cls: 'red-feature-button'
        });

        // 监听文档变化
        this.registerEvent(
            this.app.workspace.on('file-open', this.onFileOpen.bind(this))
        );

        // 监听文档内容变化
        this.registerEvent(
            this.app.vault.on('modify', this.onFileModify.bind(this))
        );

        // 检查当前打开的文件
        const currentFile = this.app.workspace.getActiveFile();
        await this.onFileOpen(currentFile);
    }

    private updateControlsState(enabled: boolean) {
        this.lockButton.disabled = !enabled;
        
        // 更新自定义选择器的禁用状态
        const templateSelect = this.customTemplateSelect.querySelector('.red-select');
        const fontSelect = this.customFontSelect.querySelector('.red-select');
        if (templateSelect) {
            templateSelect.classList.toggle('disabled', !enabled);
            templateSelect.setAttribute('style', `pointer-events: ${enabled ? 'auto' : 'none'}`);
        }
        if (fontSelect) {
            fontSelect.classList.toggle('disabled', !enabled);
            fontSelect.setAttribute('style', `pointer-events: ${enabled ? 'auto' : 'none'}`);
        }
        
        // 字号相关控件
        this.fontSizeSelect.disabled = !enabled;
        const fontSizeButtons = this.containerEl.querySelectorAll('.red-font-size-btn');
        fontSizeButtons.forEach(button => {
            (button as HTMLButtonElement).disabled = !enabled;
        });
        
        // 导出按钮
        this.copyButton.disabled = !enabled;
        const singleDownloadButton = this.containerEl.querySelector('.red-export-button');
        if (singleDownloadButton) {
            (singleDownloadButton as HTMLButtonElement).disabled = !enabled;
        }
    }

    private async togglePreviewLock() {
        this.isPreviewLocked = !this.isPreviewLocked;
        const lockIcon = this.isPreviewLocked ? '🔒' : '🔓';
        const lockStatus = this.isPreviewLocked ? '开启实时预览状态' : '关闭实时预览状态';
        this.lockButton.setText(lockIcon);
        this.lockButton.setAttribute('aria-label', lockStatus);
        
        if (!this.isPreviewLocked) {
            await this.updatePreview();
        }
    }

    async onFileOpen(file: TFile | null) {
        this.currentFile = file;
        this.currentImageIndex = 0;  // 重置图片索引
        
        if (!file || file.extension !== 'md') {
            this.previewEl.empty();
            this.previewEl.createEl('div', {
                text: '只能预览 markdown 文本文档',
                cls: 'red-empty-state'
            });
            this.updateControlsState(false);
            return;
        }

        this.updateControlsState(true);
        this.isPreviewLocked = false;
        this.lockButton.setText('🔓');
        await this.updatePreview();
    }
    async onFileModify(file: TFile) {
        if (file === this.currentFile && !this.isPreviewLocked) {
            if (this.updateTimer) {
                clearTimeout(this.updateTimer);
            }
            
            this.updateTimer = setTimeout(() => {
                this.updatePreview();
            }, 500);
        }
    }

    async updatePreview() {
        if (!this.currentFile) return;
        this.previewEl.empty();
        const content = await this.app.vault.cachedRead(this.currentFile);
        
        // 渲染 Markdown 内容
        await MarkdownRenderer.render(
            this.app,
            content,
            this.previewEl,
            this.currentFile.path,
            this
        );

        // 转换内容并检查有效性
        RedConverter.formatContent(this.previewEl);
        const hasValidContent = RedConverter.hasValidContent(this.previewEl);
        
        // 更新所有控件状态
        this.updateControlsState(hasValidContent);
        if (!hasValidContent) {
            this.copyButton.setAttribute('title', '请先添加二级标题内容');
        } else {
            this.copyButton.removeAttribute('title');
        }

        // 添加用户信息到页头
        const header = this.previewEl.querySelector('.red-preview-header');
        if (header) {
            this.previewManager.createHeaderContent(
                header as HTMLElement,
                () => this.handleAvatarClick(),
                (el) => this.handleUserNameEdit(el),
                (el) => this.handleUserIdEdit(el)
            );
        }

        // 添加页脚内容
        const footer = this.previewEl.querySelector('.red-preview-footer');
        if (footer) {
            this.previewManager.createFooterContent(
                footer as HTMLElement,
                (el, position) => this.handleFooterTextEdit(el, position)
            );
        }

        // 应用模板和背景
        this.templateManager.applyTemplate(this.previewEl);

        // 获取所有内容区块
        const sections = this.previewEl.querySelectorAll('.red-content-section');
        if (sections.length === 0) return;

        // 创建导航按钮
        const navButtons = this.previewManager.createNavigationButtons(
            this.previewEl, 
            sections.length,
            (direction) => this.navigateImages(direction)
        );
        this.navigationButtons = navButtons;

        // 显示当前图片
        this.previewManager.showImage(this.currentImageIndex, sections, this.navigationButtons);
    }

    // 处理头像点击
    private async handleAvatarClick() {
        // 创建文件选择器
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (file) {
                try {
                    // 转换为 base64
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        const base64 = e.target?.result as string;
                        // 更新设置
                        await this.settingsManager.updateSettings({
                            userAvatar: base64
                        });
                        // 刷新预览
                        await this.updatePreview();
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('头像更新失败:', error);
                }
            }
        });

        input.click();
    }

    // 处理用户名编辑
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
                userName: newName || '夜半' // 设置默认值
            });
            await this.updatePreview();
            input.remove();
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleBlur();
            }
        });
    }

    // 处理用户ID编辑
    private async handleUserIdEdit(element: HTMLElement) {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-user-edit-input';
        input.placeholder = '请输入用户ID';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            let newId = input.value.trim();
            if (!newId) {
                newId = '@Yeban'; // 设置默认值
            } else if (!newId.startsWith('@')) {
                newId = '@' + newId;
            }
            await this.settingsManager.updateSettings({
                userId: newId
            });
            await this.updatePreview();
            input.remove();
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleBlur();
            }
        });
    }

    // ... existing code ...

    private async handleFooterTextEdit(element: HTMLElement, position: 'left' | 'right') {
        const input = document.createElement('input');
        input.value = element.textContent || '';
        input.className = 'red-user-edit-input';
        input.placeholder = '请输入页脚文本';
        element.replaceWith(input);
        input.focus();

        const handleBlur = async () => {
            const newText = input.value.trim();
            await this.settingsManager.updateSettings({
                [`footer${position === 'left' ? 'Left' : 'Right'}Text`]: newText || 
                (position === 'left' ? '夜半过后，光明便启程' : '欢迎关注公众号：夜半')
            });
            await this.updatePreview();
            input.remove();
        };

        input.addEventListener('blur', handleBlur);
        input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await handleBlur();
            }
        });
    }

    // 修改 navigateImages 方法
    private navigateImages(direction: 'prev' | 'next') {
        const sections = this.previewEl.querySelectorAll('.red-content-section');
        if (direction === 'prev' && this.currentImageIndex > 0) {
            this.currentImageIndex--;
        } else if (direction === 'next' && this.currentImageIndex < sections.length - 1) {
            this.currentImageIndex++;
        }
        this.previewManager.showImage(this.currentImageIndex, sections, this.navigationButtons);
    }

    // 添加自定义下拉选择器创建方法
    private createCustomSelect(
        parent: HTMLElement,
        className: string,
        options: { value: string; label: string }[]
    ) {
        const container = parent.createEl('div', { cls: `red-select-container ${className}` });
        const select = container.createEl('div', { cls: 'red-select' });
        const selectedText = select.createEl('span', { cls: 'red-select-text' });
        const arrow = select.createEl('span', { cls: 'red-select-arrow', text: '▾' });
        
        const dropdown = container.createEl('div', { cls: 'red-select-dropdown' });
        
        options.forEach(option => {
            const item = dropdown.createEl('div', {
                cls: 'red-select-item',
                text: option.label
            });
            
            item.dataset.value = option.value;
            item.addEventListener('click', () => {
                dropdown.querySelectorAll('.red-select-item').forEach(el => 
                    el.classList.remove('red-selected'));
                item.classList.add('red-selected');
                selectedText.textContent = option.label;
                select.dataset.value = option.value;
                dropdown.classList.remove('red-show');
                select.dispatchEvent(new CustomEvent('change', {
                    detail: { value: option.value }
                }));
            });
        });
        
        // 设置默认值和选中状态
        if (options.length > 0) {
            selectedText.textContent = options[0].label;
            select.dataset.value = options[0].value;
            dropdown.querySelector('.red-select-item')?.classList.add('red-selected');
        }
        
        // 点击显示/隐藏下拉列表
        select.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('red-show');
        });
        
        // 点击其他地方关闭下拉列表
        document.addEventListener('click', () => {
            dropdown.classList.remove('red-show');
        });
        
        return container;
    }

    // 获取模板选项
    private async getTemplateOptions() {
        await this.templateManager.loadTemplates();
        const templates = this.templateManager.getAllTemplates();
        
        return templates.length > 0
            ? templates.map(t => ({ value: t.id, label: t.name }))
            : [{ value: 'default', label: '默认模板' }];
    }

    // 获取字体选项
    private getFontOptions() {
        return [
            { 
                value: 'Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, "PingFang SC", Cambria, Cochin, Georgia, Times, "Times New Roman", serif',
                label: '默认字体'
            },
            { 
                value: 'SimSun, "宋体", serif',
                label: '宋体'
            },
            { 
                value: 'SimHei, "黑体", sans-serif',
                label: '黑体'
            },
            { 
                value: 'KaiTi, "楷体", serif',
                label: '楷体'
            },
            { 
                value: '"Microsoft YaHei", "微软雅黑", sans-serif',
                label: '雅黑'
            }
        ];
    }
}
