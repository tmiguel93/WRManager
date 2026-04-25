import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

import { SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config";
import { extraMessages } from "@/i18n/extra-messages";
import { messages } from "@/i18n/messages";

type MessageTree = Record<string, string | MessageTree>;

type MissingKeyFinding = {
  key: string;
  locale: AppLocale;
  file: string;
  line: number;
};

type HardcodedFinding = {
  text: string;
  file: string;
  line: number;
  kind: "jsx-text" | "jsx-attribute";
};

const workspaceRoot = process.cwd();
const sourceRoots = ["src/app", "src/components"];
const ignoredPathParts = [
  `${path.sep}components${path.sep}ui${path.sep}`,
  `${path.sep}.next${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
];
const ignoredAttributes = new Set([
  "className",
  "href",
  "src",
  "alt",
  "id",
  "key",
  "value",
  "type",
  "name",
  "variant",
  "size",
  "role",
  "rel",
  "target",
  "width",
  "height",
  "data-slot",
]);
const ignoredExactText = new Set([
  "WRM",
  "F1",
  "F2",
  "F3",
  "GT",
  "GT3",
  "GT4",
  "WEC",
  "IMSA",
  "N/A",
  "OVR",
  "POT",
  "REP",
  "DNF",
  "PIT",
  "MAX",
]);

function listSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(fullPath);
    if (!/\.(tsx|ts)$/.test(entry.name)) return [];
    if (ignoredPathParts.some((part) => fullPath.includes(part))) return [];
    return [fullPath];
  });
}

function readMessagePath(source: MessageTree, key: string): string | undefined {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, source);
  return typeof value === "string" ? value : undefined;
}

function hasMessage(locale: AppLocale, key: string) {
  return Boolean(
    readMessagePath(messages[locale] as MessageTree, key) ??
      readMessagePath(extraMessages[locale] as MessageTree, key),
  );
}

function lineOf(sourceFile: ts.SourceFile, position: number) {
  return sourceFile.getLineAndCharacterOfPosition(position).line + 1;
}

function cleanText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function looksUserFacing(value: string) {
  const text = cleanText(value);
  if (!text) return false;
  if (ignoredExactText.has(text)) return false;
  if (text.length < 3) return false;
  if (!/[A-Za-zÀ-ÿ]/.test(text)) return false;
  if (/^[A-Z0-9_./:-]+$/.test(text)) return false;
  if (/^#[0-9a-f]{3,8}$/i.test(text)) return false;
  if (/^(GET|POST|PUT|DELETE|PATCH)$/i.test(text)) return false;
  if (/^\/[a-z0-9/_?=&.-]+$/i.test(text)) return false;
  return true;
}

function readStringLiteral(expression: ts.Expression | undefined) {
  if (!expression) return undefined;
  if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
    return expression.text;
  }
  return undefined;
}

function isTranslationCall(node: ts.CallExpression) {
  if (ts.isIdentifier(node.expression)) return node.expression.text === "t" || node.expression.text === "translate";
  if (ts.isPropertyAccessExpression(node.expression)) return node.expression.name.text === "t";
  return false;
}

function auditFile(file: string) {
  const text = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const missingKeys: MissingKeyFinding[] = [];
  const hardcoded: HardcodedFinding[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && isTranslationCall(node)) {
      const key = readStringLiteral(node.arguments[0]);
      if (key) {
        for (const locale of SUPPORTED_LOCALES) {
          if (!hasMessage(locale, key)) {
            missingKeys.push({
              key,
              locale,
              file,
              line: lineOf(sourceFile, node.getStart(sourceFile)),
            });
          }
        }
      }
    }

    if (ts.isJsxText(node)) {
      const textValue = cleanText(node.getText(sourceFile));
      if (looksUserFacing(textValue)) {
        hardcoded.push({
          text: textValue,
          file,
          line: lineOf(sourceFile, node.getStart(sourceFile)),
          kind: "jsx-text",
        });
      }
    }

    if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && !ignoredAttributes.has(node.name.text)) {
      const initializer = node.initializer;
      if (initializer && ts.isStringLiteral(initializer) && looksUserFacing(initializer.text)) {
        hardcoded.push({
          text: initializer.text,
          file,
          line: lineOf(sourceFile, node.getStart(sourceFile)),
          kind: "jsx-attribute",
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { missingKeys, hardcoded };
}

function toRelative(file: string) {
  return path.relative(workspaceRoot, file).replaceAll(path.sep, "/");
}

function printFindings(title: string, findings: Array<{ file: string; line: number; text?: string; key?: string; locale?: string }>) {
  console.log(`\n${title} (${findings.length})`);
  for (const finding of findings.slice(0, 80)) {
    const label = finding.key ? `${finding.key} [${finding.locale}]` : finding.text;
    console.log(`- ${toRelative(finding.file)}:${finding.line} ${label}`);
  }
  if (findings.length > 80) {
    console.log(`... ${findings.length - 80} more`);
  }
}

async function main() {
  const strictHardcoded = process.argv.includes("--strict-hardcoded");
  const files = sourceRoots.flatMap((root) => listSourceFiles(path.join(workspaceRoot, root)));
  const results = files.map(auditFile);
  const missingKeys = results.flatMap((result) => result.missingKeys);
  const hardcoded = results.flatMap((result) => result.hardcoded);

  console.log(`I18N audit scanned ${files.length} files.`);
  printFindings("Missing translation keys", missingKeys);
  printFindings("Potential hardcoded UI text", hardcoded);

  if (missingKeys.length > 0) {
    console.error("\nI18N audit failed: missing translation keys must be fixed.");
    process.exitCode = 1;
    return;
  }

  if (strictHardcoded && hardcoded.length > 0) {
    console.error("\nI18N audit failed: strict hardcoded text mode is enabled.");
    process.exitCode = 1;
    return;
  }

  console.log("\nI18N audit passed. Hardcoded findings are informational unless --strict-hardcoded is used.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
