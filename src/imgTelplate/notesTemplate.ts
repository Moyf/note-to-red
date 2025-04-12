import type { ImgTemplate } from '../imgTemplateManager';

export class NotesTemplate implements ImgTemplate {
    id = 'notes';
    name = '备忘录';
    sections = {
        header: true,
        content: true as const,
        footer: false
    };

    render(element: HTMLElement) {
        const sections = element.querySelectorAll('.red-content-section');
        sections.forEach(() => {
            const header = element.querySelector('.red-preview-header');
            if (header) {
                header.empty();
                header.addClass('red-notes-header');
                const headerBar = header.createEl('div', { cls: 'red-notes-bar' });
                headerBar.createEl('div', { cls: 'red-notes-actions' });
            }
            const footer = element.querySelector('.red-preview-footer');

            if (footer && !this.sections.footer) {
                footer.empty();
                footer.removeAttribute('class');
            }
        });
    }
}