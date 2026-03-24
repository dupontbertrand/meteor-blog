import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Roles } from 'meteor/roles';
import './body.html';

const TOAST_COLORS = {
  success: { bg: '#198754', icon: '&#10003;' },
  danger: { bg: '#dc3545', icon: '&#10007;' },
  warning: { bg: '#ffc107', icon: '&#9888;' },
  info: { bg: '#0dcaf0', icon: '&#8505;' },
};

export function showAlert(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const { bg, icon } = TOAST_COLORS[type] || TOAST_COLORS.success;
  const id = `toast-${Date.now()}`;
  const html = `<div id="${id}" class="toast show align-items-center text-white border-0" role="alert" style="background:${bg}">
    <div class="d-flex">
      <div class="toast-body">${icon}&ensp;${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  </div>`;
  container.insertAdjacentHTML('beforeend', html);
  setTimeout(() => {
    const el = document.getElementById(id);
    if (el) el.remove();
  }, 4000);
}

Template.App_body.helpers({
  currentUserEmail() {
    const user = Meteor.user();
    return user?.emails?.[0]?.address || '';
  },
  currentUserRole() {
    const roles = Roles.getRolesForUser(Meteor.userId());
    return roles?.[0] || '';
  },
});

Template.App_body.events({
  'click .btn-logout'(e) {
    e.preventDefault();
    Meteor.logout(() => FlowRouter.go('/login'));
  },
});
