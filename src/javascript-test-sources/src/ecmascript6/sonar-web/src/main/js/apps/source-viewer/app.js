import Marionette from 'backbone.marionette';
import SourceViewer from '../../components/source-viewer/main';
import '../../helpers/handlebars-helpers';

var App = new Marionette.Application(),
    init = function () {
      let options = window.sonarqube;

      this.addRegions({ mainRegion: options.el });

      var viewer = new SourceViewer();
      this.mainRegion.show(viewer);
      viewer.open(options.file.uuid);
      if (typeof options.file.line === 'number') {
        viewer.on('loaded', function () {
          viewer
              .highlightLine(options.file.line)
              .scrollToLine(options.file.line);
        });
      }
    };

App.on('start', function () {
  init.call(App);
});

window.sonarqube.appStarted.then(options => App.start(options));


