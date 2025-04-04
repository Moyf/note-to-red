import domtoimage from 'dom-to-image';

export class ClipboardManager {
    // 获取导出配置
    private static getExportConfig(imageElement: HTMLElement) {
        return {
            quality: 1,
            width: imageElement.offsetWidth * 4,
            height: imageElement.offsetHeight * 4,
            style: {
                transform: 'scale(4)',
                'transform-origin': 'top left',
            }
        };
    }

    // 复制图片到剪贴板
    static async copyImageToClipboard(element: HTMLElement): Promise<boolean> {
        try {
            const imageElement = element.querySelector('.red-image-preview') as HTMLElement;
            if (!imageElement) {
                throw new Error('找不到预览区域');
            }

            const blob = await domtoimage.toBlob(imageElement, this.getExportConfig(imageElement));
            
            // 创建 ClipboardItem 对象
            const clipboardItem = new ClipboardItem({
                [blob.type]: blob
            });
            
            // 写入剪贴板
            await navigator.clipboard.write([clipboardItem]);
            
            return true;
        } catch (error) {
            console.error('复制图片失败:', error);
            return false;
        }
    }
}