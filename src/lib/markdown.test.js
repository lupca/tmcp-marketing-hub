
import { describe, it, expect } from 'vitest';
import { renderMarkdown, getContentString } from './markdown';

describe('renderMarkdown', () => {
    it('should return empty string for null/undefined/non-string input', () => {
        expect(renderMarkdown(null)).toBe('');
        expect(renderMarkdown(undefined)).toBe('');
        expect(renderMarkdown(123)).toBe('');
    });

    it('should render headers correctly', () => {
        const md = '# Header 1\n## Header 2\n### Header 3\n#### Header 4';
        const html = renderMarkdown(md);
        expect(html).toContain('<h1>Header 1</h1>');
        expect(html).toContain('<h2>Header 2</h2>');
        expect(html).toContain('<h3>Header 3</h3>');
        expect(html).toContain('<h4>Header 4</h4>');
    });

    it('should render bold and italic text', () => {
        const md = 'This is **bold** and *italic* and ***both***.';
        const html = renderMarkdown(md);
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<em>italic</em>');
        expect(html).toContain('<strong><em>both</em></strong>');
    });

    it('should render unordered lists', () => {
        const md = '- Item 1\n- Item 2\n- Item 3';
        const html = renderMarkdown(md);
        expect(html).toContain('<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>');
    });

    it('should render horizontal rules', () => {
        const md = '---';
        const html = renderMarkdown(md);
        expect(html).toContain('<hr/>');
    });

    it('should handle paragraphs and line breaks', () => {
        const md = 'Line 1\nLine 2\n\nNew Paragraph';
        const html = renderMarkdown(md);
        // \n becomes <br/>, \n\n becomes </p><p>
        // The implementation wraps everything in <p>...</p> at the end
        expect(html).toContain('Line 1<br/>Line 2');
        expect(html).toContain('</p><p>New Paragraph');
    });

    it('should escape HTML characters', () => {
        const md = '<script>alert("xss")</script>';
        const html = renderMarkdown(md);
        expect(html).toContain('&lt;script&gt;');
        expect(html).not.toContain('<script>');
    });
});

describe('getContentString', () => {
    it('should return empty string for null/undefined', () => {
        expect(getContentString(null)).toBe('');
        expect(getContentString(undefined)).toBe('');
    });

    it('should return string unchanged', () => {
        expect(getContentString('hello')).toBe('hello');
    });

    it('should stringify objects', () => {
        const obj = { foo: 'bar' };
        expect(getContentString(obj)).toBe(JSON.stringify(obj, null, 2));
    });

    it('should convert numbers to string', () => {
        expect(getContentString(123)).toBe('123');
    });
});
