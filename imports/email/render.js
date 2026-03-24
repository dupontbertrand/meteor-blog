import mjml2html from 'mjml';

const cache = {};

export async function renderEmail(templateName, data = {}) {
  if (!cache[templateName]) {
    cache[templateName] = await Assets.getTextAsync(`email-templates/${templateName}`);
  }
  let source = cache[templateName];
  for (const [key, value] of Object.entries(data)) {
    source = source.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
  }
  const { html, errors } = mjml2html(source);
  if (errors.length) {
    console.warn(`MJML warnings for ${templateName}:`, errors);
  }
  return html;
}
