import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Posts } from '../../../api/posts/collection';
import './posts-list.html';

Template.postsListPage.onCreated(function () {
  this.subscribe('posts.all');
});

Template.postsListPage.helpers({
  posts() {
    return Posts.find({}, { sort: { createdAt: -1 } });
  },
  authorName(userId) {
    const user = Meteor.users.findOne(userId);
    return user?.emails?.[0]?.address?.split('@')[0] || 'unknown';
  },
  formatDate(date) {
    if (!date) return '';
    return date.toLocaleDateString();
  },
  excerpt(body) {
    if (!body) return '';
    return body.length > 200 ? body.slice(0, 200) + '...' : body;
  },
});
