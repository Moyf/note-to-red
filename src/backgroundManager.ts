import { backgrounds } from './backgrounds';

export interface Background {
    id: string;
    name: string;
    style: string;
}

export class BackgroundManager {
    private backgrounds: Background[];
    private currentBackground: Background | null = null;

    constructor() {
        this.backgrounds = backgrounds.backgrounds;
    }

    public getAllBackgrounds(): Background[] {
        return this.backgrounds;
    }

    public setBackground(id: string | null) {
        if (!id) {
            this.currentBackground = null;
            return;
        }
        const background = this.backgrounds.find(bg => bg.id === id);
        if (background) {
            this.currentBackground = background;
        }
    }

    public applyBackground(element: HTMLElement) {
        // 修改选择器为目标预览容器
        const previewContainer = element.querySelector('.red-image-preview');
        if (!previewContainer) return;

        if (!this.currentBackground) {
            previewContainer.setAttribute('style', '');  // 清除样式
            return;
        }
        previewContainer.setAttribute('style', this.currentBackground.style);
    }
}