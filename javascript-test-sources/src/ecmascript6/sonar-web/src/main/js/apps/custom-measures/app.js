import Marionette from 'backbone.marionette';
import Layout from './layout';
import CustomMeasures from './custom-measures';
import HeaderView from './header-view';
import ListView from './list-view';
import ListFooterView from './list-footer-view';
import '../../helpers/handlebars-helpers';

var App = new Marionette.Application(),
    init = function (options) {
      // Layout
      this.layout = new Layout({
        el: options.el
      });
      this.layout.render();

      // Collection
      this.customMeasures = new CustomMeasures({
        projectId: options.component.id
      });

      // Header View
      this.headerView = new HeaderView({
        collection: this.customMeasures,
        projectId: options.component.id
      });
      this.layout.headerRegion.show(this.headerView);

      // List View
      this.listView = new ListView({
        collection: this.customMeasures
      });
      this.layout.listRegion.show(this.listView);

      // List Footer View
      this.listFooterView = new ListFooterView({
        collection: this.customMeasures
      });
      this.layout.listFooterRegion.show(this.listFooterView);

      // Go!
      this.customMeasures.fetch();
    };

App.on('start', function (options) {
  init.call(App, options);
});

window.sonarqube.appStarted.then(options => App.start(options));

