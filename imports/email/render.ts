import mjml2html from 'mjml';

// Assets is provided per application by Meteor's server runtime.
declare const Assets: {
  getTextAsync(path: string): Promise<string>;
};

const cache: Record<string, string> = {};

export async function renderEmail(templateName: string, data: Record<string, string> = {}) {
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
