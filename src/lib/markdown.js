/**
 * Lightweight Markdown renderer — converts Markdown text to HTML.
 * Supports: headings (h1-h4), bold, italic, unordered lists, horizontal rules, paragraphs.
 *
 * @param {string} md - Markdown source text
 * @returns {string} HTML string
 */
export function renderMarkdown(md) {
    if (!md || typeof md !== 'string') return '';
    let html = md
        // Escape HTML
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // Headers
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Unordered lists
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr/>')
        // Line breaks (double newline = paragraph, single = <br>)
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
    // Wrap <li> groups in <ul>
    html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, '<ul>$1</ul>');
    html = html.replace(/<ul>(.*?)<\/ul>/gs, (_, inner) => '<ul>' + inner.replace(/<br\/>/g, '') + '</ul>');
    return '<p>' + html + '</p>';
}

/**
 * Normalize worksheet content to string.
 * Handles both old JSON objects and new string content.
 *
 * @param {*} content - Raw content value
 * @returns {string}
 */
export function getContentString(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') return JSON.stringify(content, null, 2);
    return String(content);
}
