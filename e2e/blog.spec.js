const { test, expect } = require('@playwright/test');

async function login(page, role) {
  await page.goto('/login');
  await page.locator('[name=email]').fill(`${role}@test.com`);
  await page.locator('[name=password]').fill('password');
  await page.locator('.auth-form button').click();
  await expect(page.locator('.btn-logout')).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
}

async function call(page, name, ...args) {
  return page.evaluate(async ({ name, args }) => {
    try {
      return { value: await Meteor.callAsync(name, ...args) };
    } catch (error) {
      return { error: error.error };
    }
  }, { name, args });
}

async function createPost(page, title) {
  await page.goto('/post/new');
  await page.locator('[name=title]').fill(title);
  await page.locator('[name=body]').fill('A post for the Meteor upgrade regression tests.');
  await page.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.locator('article h2')).toHaveText(title);
  return new URL(page.url()).pathname.split('/').pop();
}

test('public posts, login guards, registration and logout', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.post-card')).not.toHaveCount(0);
  await expect(page.locator('.post-hidden')).toHaveCount(0);
  await expect(page.getByRole('link', { name: '+ New Post' })).toHaveCount(0);
  expect(await call(page, 'posts.create', { title: 'Forbidden', body: 'Forbidden' }))
    .toEqual({ error: 'not-authorized' });
  await page.goto('/post/new');
  await expect(page).toHaveURL(/\/login$/);
  await page.locator('.tab-register').click();
  const email = `registration-${Date.now()}@test.com`;
  await page.locator('[name=email]').fill(email);
  await page.locator('[name=password]').fill('test-password');
  await page.locator('.auth-form button').click();
  await expect(page.locator('.btn-logout')).toBeVisible();
  const userId = await page.evaluate(() => Meteor.userId());
  await page.locator('.btn-logout').click();
  await expect(page).toHaveURL(/\/login$/);
  await login(page, 'admin');
  expect(await call(page, 'users.delete', userId)).not.toHaveProperty('error');
});

test('editor publishes and edits, viewer comments, and moderator manages visibility', async ({ browser }) => {
  const editor = await browser.newPage();
  const viewer = await browser.newPage();
  const moderator = await browser.newPage();
  const admin = await browser.newPage();
  const title = `Upgrade regression ${Date.now()}`;
  let postId;
  try {
    await login(editor, 'editor');
    postId = await createPost(editor, title);
    await editor.getByRole('link', { name: 'Edit', exact: true }).click();
    await editor.locator('[name=body]').fill('Updated body, preserved across the upgrade.');
    await editor.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(editor.locator('article')).toContainText('Updated body, preserved across the upgrade.');
    expect(await call(editor, 'posts.delete', postId)).toEqual({ error: 'not-authorized' });

    await login(viewer, 'viewer');
    await viewer.goto(`/post/${postId}`);
    await expect(viewer.getByRole('link', { name: 'Edit', exact: true })).toHaveCount(0);
    expect(await call(viewer, 'posts.create', { title: 'Forbidden', body: 'Forbidden' }))
      .toEqual({ error: 'not-authorized' });
    const comment = `Comment regression ${Date.now()}`;
    await viewer.locator('[name=text]').fill(comment);
    await viewer.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(editor.locator('.comment-item')).toContainText(comment);

    await login(moderator, 'moderator');
    await moderator.goto(`/post/${postId}`);
    expect(await call(moderator, 'posts.update', postId, { title, body: 'Forbidden edit' }))
      .toEqual({ error: 'not-authorized' });
    await moderator.getByRole('button', { name: 'Hide', exact: true }).click();
    await expect(moderator.getByRole('button', { name: 'Unhide', exact: true })).toBeVisible();
    // Use the list route so the single-post subscription does not retain the document.
    await viewer.goto('/');
    await expect(viewer.locator('.post-card').filter({ hasText: title })).toHaveCount(0);
    await moderator.goto('/');
    await expect(moderator.locator('.post-hidden').filter({ hasText: title })).toBeVisible();
    await moderator.goto(`/post/${postId}`);
    await moderator.getByRole('button', { name: 'Unhide', exact: true }).click();
    await expect(viewer.locator('.post-card').filter({ hasText: title })).toBeVisible();
    await moderator.locator('.btn-delete-comment').click();
    await expect(editor.locator('.comment-item')).toHaveCount(0);

    await editor.goto('/__meteor_mail__/');
    await expect(editor.locator('body')).toContainText(title);
    await expect(editor.locator('body')).toContainText('Post published');
    await expect(editor.locator('body')).toContainText('New comment');
    const mails = (await (await editor.request.get('/__meteor_mail__/api/mails')).json()).mails;
    const publishedMail = mails.find(mail => mail.subject === `Post published: ${title}`);
    const commentMail = mails.find(mail => mail.subject === `New comment on "${title}"`);
    expect(publishedMail.to).toContain('editor@test.com');
    expect(commentMail.to).toContain('editor@test.com');
    expect(commentMail.html).toContain(comment);
    await editor.goto(`/__meteor_mail__/${publishedMail.id}`);
    await expect(editor.frameLocator('iframe').locator('body')).toContainText(title);

    await login(admin, 'admin');
    await admin.goto(`/post/${postId}/edit`);
    await admin.locator('[name=title]').fill(`${title} edited by admin`);
    await admin.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(admin.locator('article h2')).toHaveText(`${title} edited by admin`);
    admin.once('dialog', dialog => dialog.accept());
    await admin.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(admin).toHaveURL(/\/$/);
    await expect(viewer.locator('.post-card').filter({ hasText: title })).toHaveCount(0);
  } finally {
    if (postId) {
      await login(admin, 'admin');
      await call(admin, 'posts.delete', postId);
    }
    await Promise.all([editor.close(), viewer.close(), moderator.close(), admin.close()]);
  }
});

test('admin changes roles and deletes users, with self-protection and server authorization', async ({ browser }) => {
  const admin = await browser.newPage();
  const viewer = await browser.newPage();
  let userId;
  try {
    await viewer.goto('/login');
    await viewer.locator('.tab-register').click();
    const email = `management-${Date.now()}@test.com`;
    await viewer.locator('[name=email]').fill(email);
    await viewer.locator('[name=password]').fill('test-password');
    await viewer.locator('.auth-form button').click();
    await expect(viewer.locator('.btn-logout')).toBeVisible();
    userId = await viewer.evaluate(() => Meteor.userId());
    await login(admin, 'admin');
    const adminId = await admin.evaluate(() => Meteor.userId());
    expect(await call(admin, 'users.setRole', adminId, 'viewer'))
      .toEqual({ error: 'cannot-change-own-role' });
    expect(await call(admin, 'users.delete', adminId)).toEqual({ error: 'cannot-delete-self' });
    expect(await call(admin, 'users.setRole', userId, 'invalid')).toEqual({ error: 'invalid-role' });
    expect(await call(viewer, 'users.setRole', userId, 'admin')).toEqual({ error: 'not-authorized' });
    expect(await call(viewer, 'users.delete', adminId)).toEqual({ error: 'not-authorized' });

    await admin.goto('/users');
    const row = admin.locator('tr').filter({ hasText: email });
    await row.locator('.role-select').selectOption('editor');
    await expect(row.locator('.badge')).toHaveText('editor');
    await viewer.goto('/');
    await expect(viewer.getByRole('link', { name: '+ New Post' })).toBeVisible();
    admin.once('dialog', dialog => dialog.accept());
    await row.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(row).toHaveCount(0);
    await expect(viewer.locator('.btn-logout')).toHaveCount(0);
  } finally {
    if (userId) await call(admin, 'users.delete', userId);
    await Promise.all([admin.close(), viewer.close()]);
  }
});
