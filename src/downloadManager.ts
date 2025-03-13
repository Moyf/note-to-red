import domtoimage from 'dom-to-image';  // 替换为 dom-to-image
import JSZip from 'jszip';

export class DownloadManager {
    // 添加共用的导出配置方法
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

    static async downloadAllImages(element: HTMLElement): Promise<void> {
        try {
            const zip = new JSZip();
            const previewContainer = element.querySelector('.red-preview-container');
            if (!previewContainer) {
                throw new Error('找不到预览容器');
            }

            const sections = previewContainer.querySelectorAll('.red-content-section');
            const totalSections = sections.length;
            const originalDisplayStates = Array.from(sections).map(
                s => (s as HTMLElement).style.display
            );

            for (let i = 0; i < totalSections; i++) {
                sections.forEach(s => (s as HTMLElement).style.display = 'none');
                (sections[i] as HTMLElement).style.display = 'block';

                const imageElement = element.querySelector('.red-image-preview') as HTMLElement;
                const blob = await domtoimage.toBlob(imageElement, this.getExportConfig(imageElement));
                zip.file(`小红书笔记_第${i + 1}页.png`, blob);
            }

            // 恢复所有 sections 的原始显示状态
            sections.forEach((s, index) => {
                (s as HTMLElement).style.display = originalDisplayStates[index];
            });

            // 生成 zip 文件并下载
            const content = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(content);
            const link = document.createElement('a');
            link.href = url;
            link.download = `小红书笔记_${new Date().getTime()}.zip`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('导出图片失败:', error);
            throw error;
        }
    }

    static async downloadSingleImage(element: HTMLElement): Promise<void> {
        try {
            const imageElement = element.querySelector('.red-image-preview') as HTMLElement;
            if (!imageElement) {
                throw new Error('找不到预览区域');
            }

            const blob = await domtoimage.toBlob(imageElement, this.getExportConfig(imageElement));

            // 创建下载链接并触发下载
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `小红书笔记_${new Date().getTime()}.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('导出图片失败:', error);
            throw error;
        }
    }
}