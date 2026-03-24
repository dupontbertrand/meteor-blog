import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/roles';
import { Posts } from './collection';

Meteor.publish('posts.all', async function () {
  // Moderators+ see hidden posts, others only see visible
  const canSeeHidden = this.userId &&
    await Roles.userIsInRoleAsync(this.userId, 'posts.hide');

  return Posts.find(
    canSeeHidden ? {} : { hidden: false },
    { sort: { createdAt: -1 } },
  );
});

Meteor.publish('posts.single', function (postId) {
  return Posts.find({ _id: postId });
});
