import $ from 'jquery';
import Marionette from 'backbone.marionette';
import SourceViewer from '../../components/source-viewer/main';
import '../../helpers/handlebars-helpers';

var App = new Marionette.Application(),
    init = function () {
      let options = window.sonarqube;
      App.addRegions({ viewerRegion: options.el });
      $('.js-drilldown-link').on('click', function (e) {
        e.preventDefault();
        $(e.currentTarget).closest('table').find('.selected').removeClass('selected');
        $(e.currentTarget).closest('tr').addClass('selected');
        var uuid = $(e.currentTarget).data('uuid'),
            viewer = new SourceViewer();
        App.viewerRegion.show(viewer);
        viewer.open(uuid);
        if (window.drilldown.period != null) {
          viewer.on('loaded', function () {
            viewer.filterLinesByDate(window.drilldown.period, window.drilldown.periodName);
          });
        }
      });
    };

App.on('start', function (options) {
  init.call(App, options);
});

window.sonarqube.appStarted.then(options => App.start(options));
