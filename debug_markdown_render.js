
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const content = "3 \\(\\frac{2}{3}\\)\n\n```solution\nStep 1: Multiply B by 2\n2B = 2 × $\\begin{pmatrix}1 & 4 & -2\\\\-3 & 3 & -1\\end{pmatrix}$\n```";

const normalizeLatex = (text) => {
    if (!text) return '';
    return text
        .replace(/\\\(/g, '$')
        .replace(/\\\)/g, '$')
        .replace(/\\\[/g, '$$$')
        .replace(/\\\]/g, '$$$');
};

const normalized = normalizeLatex(content);
console.log("Original:", content);
console.log("Normalized:", normalized);

try {
    const element = React.createElement(ReactMarkdown, {
        children: normalized,
        remarkPlugins: [remarkMath],
        rehypePlugins: [rehypeKatex]
    });

    const html = ReactDOMServer.renderToStaticMarkup(element);
    console.log("\nRendered HTML Snippet:");
    console.log(html);
} catch (e) {
    console.error("Rendering Error:", e);
}
