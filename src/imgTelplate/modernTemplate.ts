import type { ImgTemplate } from '../imgTemplateManager';

export class ModernTemplate implements ImgTemplate {
    id = 'modern';
    name = '现代模板';
    sections = {
        content: true as const
    };

    render(element: HTMLElement, settings: any) {
        element.empty();
        const content = element.createEl('div', { cls: 'red-content' });
        // ... 自定义渲染逻辑
    }
}