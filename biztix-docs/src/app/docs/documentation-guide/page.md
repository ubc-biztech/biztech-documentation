---
title: Markdown Guide for Documentation
nextjs:
metadata:
description: Detailed explanation of the project's directory layout and key files.
---

Welcome to the comprehensive guide for documenting the BizTech app. This guide will help you how to effectively use Markdown to create clear and structured documentation. {% .lead %}

## Table of Contents

1. [Headers](#headers)
2. [Paragraphs](#paragraphs)
3. [Line Breaks](#line-breaks)
4. [Emphasis](#emphasis)
5. [Blockquotes](#blockquotes)
6. [Lists](#lists)
   - [Ordered Lists](#ordered-lists)
   - [Unordered Lists](#unordered-lists)
7. [Code](#code)
   - [Inline Code](#inline-code)
   - [Code Blocks](#code-blocks)
8. [Links](#links)
9. [Images](#images)
10. [Tables](#tables)
11. [Footnotes](#footnotes)
12. [Custom Classes](#custom-classes)

## Headers

Use headers to structure your document. Markdown supports six levels of headers, with `#` being the highest (largest) level and `######` being the lowest (smallest) level.

```
# Header 1

## Header 2

### Header 3

#### Header 4

##### Header 5

###### Header 6
```

## Paragraphs

Create paragraphs by writing text separated by one or more blank lines.

```
This is a paragraph.

This is another paragraph.
```

## Line Breaks

To create a line break, end a line with two or more spaces, and then type return.

```
This is the first line.
And this is the second line.
```

## Emphasis

Emphasize text with _italic_ or **bold**.

```
_Italic text_
_Italic text_

**Bold text**
**Bold text**
```

## Blockquotes

Blockquotes are used to highlight a quote or a piece of text.

```
> This is a blockquote.
```

## Lists

### Ordered Lists

Ordered lists use numbers followed by a period.

```
1. First item
2. Second item
3. Third item
```

### Unordered Lists

Unordered lists use asterisks, pluses, or hyphens.

```
- First item
- Second item
- Third item

* First item
* Second item
* Third item

- First item
- Second item
- Third item
```

## Code

### Inline Code

For inline code, wrap the text in backticks (`).

```
Here is some `inline code`.
```

### Code Blocks

For larger code snippets, use triple backticks (```) or indent each line with four spaces.

#### Triple Backticks

```
function sayHello() {
console.log("Hello, World!");
}
```

#### Indented Code

```
function sayHello() {
    console.log("Hello, World!");
}
```

## Links

Create links using square brackets for the text and parentheses for the URL.

```
[BizTech](https://www.ubcbiztech.com/)
```

## Images

Embed images using an exclamation mark, followed by alt text in square brackets, and the path or URL in parentheses.

```
![Alt text](https://www.example.com/image.jpg)
```

## Tables

Tables are created using pipes (`|`) and hyphens (`-`).

```
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

## Footnotes

Add footnotes using a caret and square brackets in the text, and then define the footnote anywhere in the document.

```
This is an example sentence with a footnote.[^1]

[^1]: This is the footnote.
```

## Custom Classes

There are some custom classes for elements. These are often used to apply specific styles.

### Lead Paragraph

To apply a lead style to a paragraph, use `{% .lead %}`.

### Callouts

Callouts are used to highlight important information or warnings. They can have different styles based on the type of message.

### Warning Callout

To create a warning callout, use `{% callout type="warning" title="Your Title" %}`. Make sure to close the paragraph with `{% /callout %}`

{% callout type="warning" title="Documentation Maintenance" %}
This page should be updated whenever significant changes to the project structure are made, to keep it consistent and useful for all developers.
{% /callout %}

### Informational Callout

For general information callouts, use `{% callout title="Your Title" %}` without specifying a type. Make sure to close the paragraph with `{% /callout %}`

{% callout title="Missing Packages" %}
If you encounter any issues during the installation, try running `npm install` again or use `npm ci` for a clean install based on `package-lock.json`.
{% /callout %}
