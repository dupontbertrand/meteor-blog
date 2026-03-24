import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Roles } from 'meteor/roles';
import { Posts } from '../../../api/posts/collection';
import { Comments } from '../../../api/comments/collection';
import { showAlert } from '../../layouts/body/body';
import './post-detail.html';

Template.postDetailPage.onCreated(function () {
  this.autorun(() => {
    const postId = FlowRouter.getParam('id');
    if (postId) {
      this.subscribe('posts.single', postId);
      this.subscribe('comments.byPost', postId);
    }
  });
});

Template.postDetailPage.helpers({
  post() {
    return Posts.findOne(FlowRouter.getParam('id'));
  },
  comments() {
    return Comments.find({ postId: FlowRouter.getParam('id') }, { sort: { createdAt: 1 } });
  },
  commentCount() {
    return Comments.find({ postId: FlowRouter.getParam('id') }).count();
  },
  canEdit() {
    const post = Posts.findOne(FlowRouter.getParam('id'));
    if (!post) return false;
    if (Roles.userIsInRole(Meteor.userId(), 'posts.edit.all')) return true;
    return Roles.userIsInRole(Meteor.userId(), 'posts.edit.own') && post.authorId === Meteor.userId();
  },
  authorName(userId) {
    const user = Meteor.users.findOne(userId);
    return user?.emails?.[0]?.address?.split('@')[0] || 'unknown';
  },
  formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString();
  },
});

Template.postDetailPage.events({
  async 'submit .comment-form'(e) {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (!text) return;
    const postId = FlowRouter.getParam('id');
    try {
      await Meteor.callAsync('comments.create', postId, text);
      e.target.reset();
      showAlert('Comment posted');
    } catch (err) {
      showAlert(err.reason || err.message, 'danger');
    }
  },

  async 'click .btn-toggle-hide'() {
    const postId = FlowRouter.getParam('id');
    try {
      await Meteor.callAsync('posts.toggleHide', postId);
      const post = Posts.findOne(postId);
      showAlert(post?.hidden ? 'Post hidden' : 'Post visible again');
    } catch (err) {
      showAlert(err.reason || err.message, 'danger');
    }
  },

  async 'click .btn-delete'() {
    if (!confirm('Delete this post?')) return;
    const postId = FlowRouter.getParam('id');
    try {
      await Meteor.callAsync('posts.delete', postId);
      showAlert('Post deleted');
      FlowRouter.go('/');
    } catch (err) {
      showAlert(err.reason || err.message, 'danger');
    }
  },

  async 'click .btn-delete-comment'(e) {
    const commentId = e.currentTarget.dataset.commentId;
    try {
      await Meteor.callAsync('comments.delete', commentId);
      showAlert('Comment deleted');
    } catch (err) {
      showAlert(err.reason || err.message, 'danger');
    }
  },
});
