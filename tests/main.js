import assert from 'node:assert/strict';
import { Posts } from '../imports/api/posts/collection';
import { Comments } from '../imports/api/comments/collection';
import { renderEmail } from '../imports/email/render';

describe('blog data and email templates', function () {
  const postIds = [];
  const commentIds = [];

  afterEach(async function () {
    await Comments.removeAsync({ _id: { $in: commentIds.splice(0) } });
    await Posts.removeAsync({ _id: { $in: postIds.splice(0) } });
  });

  it('preserves post content, visibility and dates through MongoDB writes', async function () {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    const id = await Posts.insertAsync({
      title: 'Test post', body: 'Original body', authorId: 'test-author',
      hidden: false, createdAt, updatedAt: createdAt,
    });
    postIds.push(id);
    const updatedAt = new Date('2026-01-02T00:00:00Z');
    await Posts.updateAsync(id, { $set: { body: 'Edited body', hidden: true, updatedAt } });
    const post = await Posts.findOneAsync(id);
    assert.equal(post.body, 'Edited body');
    assert.equal(post.hidden, true);
    assert.deepEqual(post.createdAt, createdAt);
    assert.deepEqual(post.updatedAt, updatedAt);
    await Posts.removeAsync(id);
    assert.equal(await Posts.findOneAsync(id), undefined);
  });

  it('stores comments associated with their post and author', async function () {
    const createdAt = new Date();
    const id = await Comments.insertAsync({
      postId: 'test-post', authorId: 'test-commenter', text: 'Test comment', createdAt,
    });
    commentIds.push(id);
    const comment = await Comments.findOneAsync(id);
    assert.equal(comment.postId, 'test-post');
    assert.equal(comment.authorId, 'test-commenter');
    assert.equal(comment.text, 'Test comment');
    assert.deepEqual(comment.createdAt, createdAt);
  });

  for (const [template, data] of [
    ['post-published.mjml', { title: 'Published title', author: 'editor@test.com', url: 'http://localhost/post/test' }],
    ['new-comment.mjml', { postTitle: 'Commented title', commenter: 'viewer', comment: 'Comment text', url: 'http://localhost/post/test' }],
  ]) {
    it(`renders ${template} from private assets with substituted content`, async function () {
      const html = await renderEmail(template, data);
      assert.match(html, /<!doctype html>/i);
      assert.doesNotMatch(html, /<mj-|\{\{/);
      for (const value of Object.values(data)) assert.ok(html.includes(value), value);
    });
  }
});
