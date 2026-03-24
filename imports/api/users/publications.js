import { Meteor } from 'meteor/meteor';
import { Roles } from 'meteor/roles';

// Publish own role assignments (for isInRole checks on client)
Meteor.publish(null, function () {
  if (!this.userId) return this.ready();
  return Meteor.roleAssignment.find({ 'user._id': this.userId });
});

// Publish all users + their role assignments (admin only)
Meteor.publish('users.all', async function () {
  if (!this.userId) return this.ready();
  if (!await Roles.userIsInRoleAsync(this.userId, 'users.manage')) {
    return this.ready();
  }
  return [
    Meteor.users.find({}, { fields: { emails: 1, createdAt: 1 } }),
    Meteor.roleAssignment.find({}),
  ];
});

// Publish user names for display (post authors, commenters)
Meteor.publish('users.names', function (userIds) {
  if (!Array.isArray(userIds)) return this.ready();
  return Meteor.users.find(
    { _id: { $in: userIds } },
    { fields: { emails: 1 } },
  );
});
