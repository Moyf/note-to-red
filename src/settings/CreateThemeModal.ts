import { App, Modal, Setting } from 'obsidian';
import { Theme } from '../themeManager';

export class CreateThemeModal extends Modal {
    theme: Theme;
    onSubmit: (theme: Theme) => void;
    isEditing: boolean;

    constructor(app: App, onSubmit: (theme: Theme) => void, existingTheme?: Theme) {
        super(app);
        this.onSubmit = onSubmit;
        this.isEditing = !!existingTheme;
        if(existingTheme){
            this.theme = existingTheme;
        }
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h2', { text: this.isEditing ? '编辑模板' : '新建模板' });

        new Setting(contentEl)
            .setName('模板名称')
            .addText(text => text
                .setPlaceholder('请输入模板名称')
                .setValue(this.theme.name)
                .onChange(value => {
                    this.theme.name = value;
                }));

        // 移除模板描述相关代码
        const buttonContainer = contentEl.createEl('div', { cls: 'red-modal-buttons' });
        
        const saveButton = buttonContainer.createEl('button', {
            cls: 'red-modal-button red-modal-button-save',
            text: '保存'
        });
        saveButton.addEventListener('click', () => {
            if (this.theme.name) {
                this.onSubmit(this.theme);
                this.close();
            }
        });

        const cancelButton = buttonContainer.createEl('button', {
            cls: 'red-modal-button',
            text: '取消'
        });
        cancelButton.addEventListener('click', () => {
            this.close();
        });
    }
}