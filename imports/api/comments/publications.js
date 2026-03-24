import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Comments } from './collection';

Meteor.publish('comments.byPost', function (postId) {
  check(postId, String);
  return Comments.find({ postId }, { sort: { createdAt: 1 } });
});
