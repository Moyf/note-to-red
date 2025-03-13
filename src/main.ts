import { Plugin, Notice } from 'obsidian';
import { RedView, VIEW_TYPE_RED } from './view';  // 暂时改回原来的导入
import { TemplateManager } from './templateManager';
import { SettingsManager } from './settings';
import { RedConverter } from './converter';  // 暂时使用原来的转换器
import { DonateManager } from './donateManager';

export default class RedPlugin extends Plugin {
    private settingsManager: SettingsManager;

    async onload() {
        // 初始化设置管理器
        this.settingsManager = new SettingsManager(this);
        await this.settingsManager.loadSettings();

        // 初始化模板管理器
        const templateManager = new TemplateManager(this.app);
        
        // 初始化转换器
        RedConverter.initialize(this.app);
        
        DonateManager.initialize(this.app, this);

        // 注册视图
        this.registerView(
            VIEW_TYPE_RED,
            (leaf) => new RedView(leaf, templateManager, this.settingsManager)
        );

        // 添加首次加载自动打开视图的逻辑
        this.app.workspace.onLayoutReady(() => {
            if (this.app.workspace.getLeavesOfType(VIEW_TYPE_RED).length === 0) {
                const leaf = this.app.workspace.getRightLeaf(false);
                if (leaf) {
                    leaf.setViewState({
                        type: VIEW_TYPE_RED,
                        active: false  // 设置为 false 表示不聚焦
                    });
                }
            }
        });

        // 添加命令到命令面板
        this.addCommand({
            id: 'open-mp-preview',
            name: '打开小红书图片预览',
            callback: async () => {
                await this.activateView();
            }
        });
    }

    async onunload() {
        // 清理视图
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_RED);  // 使用原来的视图类型
    }
    
    async activateView() {
        // 如果视图已经存在，激活它
        const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_RED);  // 使用原来的视图类型
        if (leaves.length > 0) {
            this.app.workspace.revealLeaf(leaves[0]);
            return;
        }

        // 创建新视图
        const rightLeaf = this.app.workspace.getRightLeaf(false);
        if (rightLeaf) {
            await rightLeaf.setViewState({
                type: VIEW_TYPE_RED,
                active: true,
            });
        } else {
            new Notice('无法创建视图面板');
        }
    }
}