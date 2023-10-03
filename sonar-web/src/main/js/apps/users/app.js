import Marionette from 'backbone.marionette';
import Layout from './layout';
import Users from './users';
import HeaderView from './header-view';
import SearchView from './search-view';
import ListView from './list-view';
import ListFooterView from './list-footer-view';
import '../../helpers/handlebars-helpers';

var App = new Marionette.Application(),
    init = function () {
      let options = window.sonarqube;

      // Layout
      this.layout = new Layout({ el: options.el });
      this.layout.render();

      // Collection
      this.users = new Users();

      // Header View
      this.headerView = new HeaderView({ collection: this.users });
      this.layout.headerRegion.show(this.headerView);

      // Search View
      this.searchView = new SearchView({ collection: this.users });
      this.layout.searchRegion.show(this.searchView);

      // List View
      this.listView = new ListView({ collection: this.users });
      this.layout.listRegion.show(this.listView);

      // List Footer View
      this.listFooterView = new ListFooterView({ collection: this.users });
      this.layout.listFooterRegion.show(this.listFooterView);

      // Go!
      this.users.fetch();
    };

App.on('start', function () {
  init.call(App);
});

window.sonarqube.appStarted.then(options => App.start(options));


