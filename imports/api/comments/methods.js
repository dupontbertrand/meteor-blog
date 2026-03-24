import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Roles } from 'meteor/roles';
import { Comments } from './collection';
import { Posts } from '../posts/collection';
import { renderEmail } from '../../email/render';

Meteor.methods({
  async 'comments.create'(postId, text) {
    check(postId, String);
    check(text, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!await Roles.userIsInRoleAsync(this.userId, 'comments.create')) {
      throw new Meteor.Error('not-authorized', 'You cannot comment');
    }

    const commentId = await Comments.insertAsync({
      postId,
      authorId: this.userId,
      text,
      createdAt: new Date(),
    });

    // Notify post author
    if (!this.isSimulation) {
      const post = await Posts.findOneAsync(postId);
      if (post && post.authorId !== this.userId) {
        const postAuthor = await Meteor.users.findOneAsync(post.authorId);
        const commenter = await Meteor.users.findOneAsync(this.userId);
        const toEmail = postAuthor?.emails?.[0]?.address;
        const commenterName = commenter?.emails?.[0]?.address?.split('@')[0] || 'Someone';

        if (toEmail) {
          try {
            const html = await renderEmail('new-comment.mjml', {
              postTitle: post.title,
              commenter: commenterName,
              comment: text,
              url: Meteor.absoluteUrl(`post/${postId}`),
            });
            await Email.sendAsync({
              from: `Blog <noreply@blog.local>`,
              to: toEmail,
              subject: `New comment on "${post.title}"`,
              html,
            });
          } catch (e) {
            console.warn('Email send failed:', e.message);
          }
        }
      }
    }

    return commentId;
  },

  async 'comments.delete'(commentId) {
    check(commentId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!await Roles.userIsInRoleAsync(this.userId, 'comments.delete')) {
      throw new Meteor.Error('not-authorized', 'You cannot delete comments');
    }
    await Comments.removeAsync(commentId);
  },
});
