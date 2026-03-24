import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Roles } from 'meteor/roles';

const VALID_ROLES = ['admin', 'moderator', 'editor', 'viewer'];

Meteor.methods({
  async 'users.setRole'(userId, role) {
    check(userId, String);
    check(role, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!await Roles.userIsInRoleAsync(this.userId, 'users.manage')) {
      throw new Meteor.Error('not-authorized', 'Admin only');
    }
    if (!VALID_ROLES.includes(role)) {
      throw new Meteor.Error('invalid-role');
    }
    if (userId === this.userId) {
      throw new Meteor.Error('cannot-change-own-role');
    }
    await Roles.setUserRolesAsync(userId, [role]);
  },

  async 'users.delete'(userId) {
    check(userId, String);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!await Roles.userIsInRoleAsync(this.userId, 'users.manage')) {
      throw new Meteor.Error('not-authorized', 'Admin only');
    }
    if (userId === this.userId) {
      throw new Meteor.Error('cannot-delete-self');
    }
    await Meteor.users.removeAsync(userId);
  },
});
