import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

import '../../ui/layouts/body/body.js';
import '../../ui/pages/login/login.js';
import '../../ui/pages/posts-list/posts-list.js';
import '../../ui/pages/post-detail/post-detail.js';
import '../../ui/pages/post-edit/post-edit.js';
import '../../ui/pages/users/users.js';

const requireLogin = (context, redirect) => {
  if (!Meteor.userId()) redirect('/login');
};

FlowRouter.route('/', {
  name: 'posts.list',
  action() { this.render('App_body', 'postsListPage'); },
});

FlowRouter.route('/login', {
  name: 'login',
  action() { this.render('App_body', 'loginPage'); },
});

FlowRouter.route('/post/new', {
  name: 'posts.new',
  triggersEnter: [requireLogin],
  action() { this.render('App_body', 'postEditPage'); },
});

FlowRouter.route('/post/:id', {
  name: 'posts.detail',
  action() { this.render('App_body', 'postDetailPage'); },
});

FlowRouter.route('/post/:id/edit', {
  name: 'posts.edit',
  triggersEnter: [requireLogin],
  action() { this.render('App_body', 'postEditPage'); },
});

FlowRouter.route('/users', {
  name: 'users',
  triggersEnter: [requireLogin],
  action() { this.render('App_body', 'usersPage'); },
});

FlowRouter.route('*', {
  action() { this.render('App_body', 'postsListPage'); },
});
