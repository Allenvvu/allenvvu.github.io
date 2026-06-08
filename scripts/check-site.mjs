import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const linkedinUrl = "https://www.linkedin.com/in/allen-w-307451229/";
const githubUrl = "https://github.com/Allenvvu";

function readRequired(fileName) {
  const filePath = join(root, fileName);
  assert.ok(existsSync(filePath), `Missing required file: ${fileName}`);
  return readFileSync(filePath, "utf8");
}

function assertIncludes(content, expected, label) {
  assert.ok(content.includes(expected), `${label} missing: ${expected}`);
}

const checks = {
  home() {
    const html = readRequired("index.html");

    assertIncludes(html, "<title>Allen Wu</title>", "home title");
    assertIncludes(html, '<link rel="stylesheet" href="styles.css">', "home stylesheet");
    assertIncludes(html, '<div class="portrait-placeholder"', "portrait dummy block");
    assertIncludes(html, '<h1 class="name">Allen Wu</h1>', "home name");
    assertIncludes(
      html,
      '<p class="tagline">Engineer, builder, artist, lifelong learner.</p>',
      "home tagline"
    );
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
