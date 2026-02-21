import sanitizeHtml from "sanitize-html";

const plainTextSanitizeConfig = {
  allowedTags: [],
  allowedAttributes: {},
};

export function sanitizePlainText(content: string) {
  return sanitizeHtml(content, plainTextSanitizeConfig).trim();
}

export function validateContent(html: string, length: number = 1000) {
  if (html.length > length) {
    throw new Error(`Content cannot be longer than ${length} characters`);
  }
  const sanitized = sanitizePlainText(html);

  if (sanitized.length === 0 || sanitized === "") {
    throw new Error("Content cannot be empty");
  }

  return sanitized;
}
