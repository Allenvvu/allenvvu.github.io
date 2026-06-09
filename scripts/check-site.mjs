import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const linkedinUrl = "https://www.linkedin.com/in/allen-w-307451229/";
const githubUrl = "https://github.com/Allenvvu";
const googleFontsUrl =
  "https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400..700&family=Source+Serif+4:ital,wght@1,400&display=swap";

function readRequired(fileName) {
  const filePath = join(root, fileName);
  assert.ok(existsSync(filePath), `Missing required file: ${fileName}`);
  return readFileSync(filePath, "utf8");
}

function assertIncludes(content, expected, label) {
  assert.ok(content.includes(expected), `${label} missing: ${expected}`);
}

function assertNewsreaderLinks(html, label) {
  assertIncludes(
    html,
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    `${label} Google Fonts preconnect`
  );
  assertIncludes(
    html,
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `${label} Google Fonts static preconnect`
  );
  assertIncludes(
    html,
    `<link href="${googleFontsUrl}" rel="stylesheet">`,
    `${label} font stylesheet`
  );
}

const checks = {
  home() {
    const html = readRequired("index.html");

    assertIncludes(html, "<title>Allen Wu</title>", "home title");
    assertIncludes(html, '<link rel="stylesheet" href="styles.css">', "home stylesheet");
    assertNewsreaderLinks(html, "home");
    assertIncludes(html, '<div class="portrait-placeholder"', "portrait dummy block");
    assertIncludes(html, '<h1 class="name">Allen Wu</h1>', "home name");
    assertIncludes(html, '<p class="tagline">', "home tagline");
    assertIncludes(html, `href="${linkedinUrl}"`, "home LinkedIn link");
    assertIncludes(html, 'href="projects.html"', "home Projects link");
    assertIncludes(html, `href="${githubUrl}"`, "home GitHub link");
    assertIncludes(html, '<blockquote class="quote">', "home quote block");
    assertIncludes(html, '<section class="bio"', "home bio section");
  },

  projects() {
    const html = readRequired("projects.html");

    assertIncludes(html, "<title>Projects | Allen Wu</title>", "projects title");
    assertIncludes(html, '<link rel="stylesheet" href="styles.css">', "projects stylesheet");
    assertNewsreaderLinks(html, "projects");
    assertIncludes(html, '<h1 class="name">Projects</h1>', "projects heading");
    assertIncludes(html, 'href="index.html"', "projects Home link");
    assertIncludes(html, `href="${linkedinUrl}"`, "projects LinkedIn link");
    assertIncludes(html, `href="${githubUrl}"`, "projects GitHub link");
    assertIncludes(html, '<section class="project-list"', "projects list");
    assertIncludes(html, "Project One", "first dummy project");
    assertIncludes(html, "Project Two", "second dummy project");
    assertIncludes(html, "Project Three", "third dummy project");
  },

  styles() {
    const css = readRequired("styles.css");

    for (const selector of [
      ".app-container",
      ".hero-section",
      ".portrait-placeholder",
      ".name",
      ".tagline",
      ".social-links",
      ".quote",
      ".bio",
      ".project-list",
      ".project-item",
    ]) {
      assertIncludes(css, selector, `CSS selector ${selector}`);
    }

    assert.match(css, /@media \(max-width: 768px\)/, "mobile media query");
    assertIncludes(css, "letter-spacing: 0;", "non-negative letter spacing");
    assertIncludes(
      css,
      'font-family: "Newsreader", Georgia, "Times New Roman", serif;',
      "Newsreader site font"
    );
    assertIncludes(
      css,
      'font-family: "Source Serif 4", Georgia, "Times New Roman", serif;',
      "Source Serif 4 quote font"
    );
    assertIncludes(css, ".name {\n  margin-bottom: 12px;\n  color: #1a202c;\n  font-size: 2.65rem;", "desktop name size");
    assertIncludes(css, ".tagline {\n  max-width: 560px;\n  margin: 0 auto 35px;\n  color: #64748b;\n  font-size: 1.08rem;", "desktop tagline size");
    assertIncludes(css, ".social-links {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  justify-content: center;\n  gap: 8px;\n  font-size: 1rem;", "desktop link size");
    assertIncludes(css, "font-size: 1.125rem;", "desktop quote text size");
    assertIncludes(css, ".quote-author {\n  display: block;\n  color: #94a3b8;\n  font-size: 0.875rem;", "desktop quote author size");
    assertIncludes(css, ".bio {\n  color: #334155;\n  font-size: 1.15rem;", "desktop bio size");
    assertIncludes(css, ".quote-text {\n    font-size: 1.05rem;", "mobile quote text size");
    assertIncludes(css, ".bio {\n    font-size: 1.08rem;", "mobile bio size");
  },
};

const mode = process.argv[2] ?? "all";

if (mode === "all") {
  checks.home();
  checks.projects();
  checks.styles();
} else if (checks[mode]) {
  checks[mode]();
} else {
  throw new Error(`Unknown check mode: ${mode}`);
}

console.log(`Static site smoke check passed: ${mode}`);
