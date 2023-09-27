import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import Template from './templates/maintenance-main.hbs';

export default Marionette.ItemView.extend({
  template: Template,

  events: {
    'click #start-migration': 'startMigration'
  },

  initialize: function () {
    var that = this;
    this.requestOptions = {
      type: 'GET',
      url: baseUrl + '/api/system/' + (this.options.setup ? 'db_migration_status' : 'status')
    };
    this.pollingInternal = setInterval(function () {
      that.refresh();
    }, 5000);
  },

  refresh: function () {
    var that = this;
    return Backbone.ajax(this.requestOptions).done(function (r) {
      that.model.set(r);
      that.render();
      if (that.model.get('status') === 'UP' || that.model.get('state') === 'NO_MIGRATION') {
        that.stopPolling();
      }
      if (that.model.get('state') === 'MIGRATION_SUCCEEDED') {
        that.goHome();
      }
    });
  },

  stopPolling: function () {
    clearInterval(this.pollingInternal);
  },

  startMigration: function () {
    var that = this;
    Backbone.ajax({
      url: baseUrl + '/api/system/migrate_db',
      type: 'POST'
    }).done(function (r) {
      that.model.set(r);
      that.render();
    });
  },

  onRender: function () {
    $('.page-simple').toggleClass('panel-warning', this.model.get('state') === 'MIGRATION_REQUIRED');
  },

  goHome: function () {
    setInterval(function () {
      window.location = baseUrl + '/';
    }, 2500);
  },

  serializeData: function () {
    return _.extend(this._super(), { setup: this.options.setup });
  }
});


