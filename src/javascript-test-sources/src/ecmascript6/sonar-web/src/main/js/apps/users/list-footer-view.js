import _ from 'underscore';
import Marionette from 'backbone.marionette';
import Template from './templates/users-list-footer.hbs';

export default Marionette.ItemView.extend({
  template: Template,

  collectionEvents: {
    'all': 'render'
  },

  events: {
    'click #users-fetch-more': 'onMoreClick'
  },

  onMoreClick: function (e) {
    e.preventDefault();
    this.fetchMore();
  },

  fetchMore: function () {
    this.collection.fetchMore();
  },

  serializeData: function () {
    return _.extend(this._super(), {
      total: this.collection.total,
      count: this.collection.length,
      more: this.collection.hasMore()
    });
  }
});


