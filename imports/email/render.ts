import mjml2html from 'mjml';

// Assets is provided per application by Meteor's server runtime. The native
// package declarations do not cover this global yet; remove this shim once
// https://github.com/meteor/meteor/pull/14829 ships.
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
