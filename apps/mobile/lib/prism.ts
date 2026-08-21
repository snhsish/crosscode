import { Prism } from "prism-react-renderer"

type PrismGlobal = typeof globalThis & { Prism?: typeof Prism }

const prismGlobal = globalThis as PrismGlobal

prismGlobal.Prism = Prism

// These grammars are not included in prism-react-renderer's default bundle.
require("prismjs/components/prism-bash")
require("prismjs/components/prism-c")
require("prismjs/components/prism-csharp")
require("prismjs/components/prism-dart")
require("prismjs/components/prism-diff")
require("prismjs/components/prism-java")
require("prismjs/components/prism-markup-templating")
require("prismjs/components/prism-php")
require("prismjs/components/prism-ruby")
require("prismjs/components/prism-sql")

const languageAliases: Record<string, string> = {
    "c#": "csharp",
    "c++": "cpp",
    html: "markup",
    javascript: "javascript",
    js: "javascript",
    md: "markdown",
    py: "python",
    sh: "bash",
    shell: "bash",
    ts: "typescript",
    typescript: "typescript",
    xml: "markup",
    yml: "yaml",
}

const languageLabels: Record<string, string> = {
    bash: "Bash",
    c: "C",
    cpp: "C++",
    csharp: "C#",
    css: "CSS",
    dart: "Dart",
    diff: "Diff",
    go: "Go",
    graphql: "GraphQL",
    java: "Java",
    javascript: "JavaScript",
    json: "JSON",
    kotlin: "Kotlin",
    markup: "HTML",
    markdown: "Markdown",
    php: "PHP",
    python: "Python",
    ruby: "Ruby",
    rust: "Rust",
    sql: "SQL",
    swift: "Swift",
    typescript: "TypeScript",
    yaml: "YAML",
}

export function normalizeLanguage(language?: string): string {
    const normalized = language?.trim().toLowerCase().replace(/^language-/, "")
    if (!normalized) return "text"
    return languageAliases[normalized] ?? normalized
}

export function displayLanguage(language?: string): string {
    const normalized = normalizeLanguage(language)
    return languageLabels[normalized] ?? (normalized === "text" ? "Code" : normalized.toUpperCase())
}

export { Prism }
