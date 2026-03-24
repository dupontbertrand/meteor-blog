import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Roles } from 'meteor/roles';
import { Posts } from './collection';
import { renderEmail } from '../../email/render';

Meteor.methods({
  async 'posts.create'({ title, body }) {
    check(title, String);
    check(body, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!await Roles.userIsInRoleAsync(this.userId, 'posts.create')) {
      throw new Meteor.Error('not-authorized', 'You cannot create posts');
    }

    const postId = await Posts.insertAsync({
      title,
      body,
      authorId: this.userId,
      hidden: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Notify via email
    if (!this.isSimulation) {
      const author = await Meteor.users.findOneAsync(this.userId);
      const authorEmail = author?.emails?.[0]?.address || 'unknown';
      try {
        const html = await renderEmail('post-published.mjml', {
          title,
          author: authorEmail,
          url: Meteor.absoluteUrl(`post/${postId}`),
        });
        await Email.sendAsync({
          from: `Blog <noreply@blog.local>`,
          to: authorEmail,
          subject: `Post published: ${title}`,
          html,
        });
      } catch (e) {
        console.warn('Email send failed:', e.message);
      }
    }

    return postId;
  },

  async 'posts.update'(postId, { title, body }) {
    check(postId, String);
    check(title, String);
    check(body, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');

    const post = await Posts.findOneAsync(postId);
    if (!post) throw new Meteor.Error('not-found');

    const canEditAll = await Roles.userIsInRoleAsync(this.userId, 'posts.edit.all');
    const canEditOwn = await Roles.userIsInRoleAsync(this.userId, 'posts.edit.own');

    if (!canEditAll && !(canEditOwn && post.authorId === this.userId)) {
      throw new Meteor.Error('not-authorized', 'You cannot edit this post');
    }

    await Posts.updateAsync(postId, {
      $set: { title, body, updatedAt: new Date() },
    });
  },

  async 'posts.delete'(postId) {
    check(postId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!await Roles.userIsInRoleAsync(this.userId, 'posts.delete')) {
      throw new Meteor.Error('not-authorized', 'You cannot delete posts');
    }
    await Posts.removeAsync(postId);
  },

  async 'posts.toggleHide'(postId) {
    check(postId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!await Roles.userIsInRoleAsync(this.userId, 'posts.hide')) {
      throw new Meteor.Error('not-authorized', 'You cannot hide posts');
    }
    const post = await Posts.findOneAsync(postId);
    if (!post) throw new Meteor.Error('not-found');
    await Posts.updateAsync(postId, { $set: { hidden: !post.hidden } });
  },
});
