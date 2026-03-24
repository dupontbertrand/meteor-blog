import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Accounts } from 'meteor/accounts-base';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import './login.html';

Template.loginPage.onCreated(function () {
  this.isLogin = new ReactiveVar(true);
  this.error = new ReactiveVar('');
});

Template.loginPage.helpers({
  isLogin() { return Template.instance().isLogin.get(); },
  error() { return Template.instance().error.get(); },
});

Template.loginPage.events({
  'click .tab-login'(e, instance) {
    e.preventDefault();
    instance.isLogin.set(true);
    instance.error.set('');
  },
  'click .tab-register'(e, instance) {
    e.preventDefault();
    instance.isLogin.set(false);
    instance.error.set('');
  },
  'submit .auth-form'(e, instance) {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    instance.error.set('');

    if (instance.isLogin.get()) {
      Meteor.loginWithPassword(email, password, (err) => {
        if (err) {
          instance.error.set(err.reason || err.message);
        } else {
          FlowRouter.go('/');
        }
      });
    } else {
      Accounts.createUser({ email, password }, (err) => {
        if (err) {
          instance.error.set(err.reason || err.message);
        } else {
          FlowRouter.go('/');
        }
      });
    }
  },
});
