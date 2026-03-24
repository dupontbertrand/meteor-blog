import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Roles } from 'meteor/roles';
import { showAlert } from '../../layouts/body/body';
import './users.html';

Template.usersPage.onCreated(function () {
  this.subscribe('users.all');
});

Template.usersPage.helpers({
  allUsers() {
    return Meteor.users.find({}, { sort: { createdAt: 1 } });
  },
  userEmail(user) {
    return user?.emails?.[0]?.address || '';
  },
  currentRole(user) {
    const roles = Roles.getRolesForUser(user._id);
    return roles?.[0] || 'viewer';
  },
  isRole(user, role) {
    return Roles.getRolesForUser(user._id)?.[0] === role;
  },
  isSelf(userId) {
    return userId === Meteor.userId();
  },
});

Template.usersPage.events({
  async 'change .role-select'(e) {
    const userId = e.currentTarget.dataset.userId;
    const role = e.currentTarget.value;
    const email = e.currentTarget.closest('tr').querySelector('td').textContent;
    try {
      await Meteor.callAsync('users.setRole', userId, role);
      showAlert(`${email} is now <strong>${role}</strong>`);
    } catch (err) {
      showAlert(err.reason || err.message, 'danger');
    }
  },

  async 'click .btn-delete-user'(e) {
    const userId = e.currentTarget.dataset.userId;
    if (!confirm('Delete this user?')) return;
    try {
      await Meteor.callAsync('users.delete', userId);
      showAlert('User deleted');
    } catch (err) {
      showAlert(err.reason || err.message, 'danger');
    }
  },
});
