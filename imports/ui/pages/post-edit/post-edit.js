import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Posts } from '../../../api/posts/collection';
import { showAlert } from '../../layouts/body/body';
import './post-edit.html';

Template.postEditPage.onCreated(function () {
  this.autorun(() => {
    const postId = FlowRouter.getParam('id');
    if (postId) {
      this.subscribe('posts.single', postId);
    }
  });
});

Template.postEditPage.helpers({
  isNew() {
    return !FlowRouter.getParam('id');
  },
  post() {
    return Posts.findOne(FlowRouter.getParam('id'));
  },
  cancelUrl() {
    const postId = FlowRouter.getParam('id');
    return postId ? `/post/${postId}` : '/';
  },
});

Template.postEditPage.events({
  async 'submit .post-form'(e) {
    e.preventDefault();
    const title = e.target.title.value.trim();
    const body = e.target.body.value.trim();
    if (!title || !body) return;

    const postId = FlowRouter.getParam('id');
    try {
      if (postId) {
        await Meteor.callAsync('posts.update', postId, { title, body });
        showAlert('Post updated successfully');
        FlowRouter.go(`/post/${postId}`);
      } else {
        const newId = await Meteor.callAsync('posts.create', { title, body });
        showAlert('Post published!');
        FlowRouter.go(`/post/${newId}`);
      }
    } catch (err) {
      showAlert(err.reason || err.message, 'danger');
    }
  },
});
