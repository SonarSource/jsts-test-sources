import WorkspaceListView from '../../components/navigator/workspace-list-view';
import WorkspaceListItemView from './workspace-list-item-view';
import WorkspaceListEmptyView from './workspace-list-empty-view';
import Template from './templates/coding-rules-workspace-list.hbs';

export default WorkspaceListView.extend({
  template: Template,
  childView: WorkspaceListItemView,
  childViewContainer: '.js-list',
  emptyView: WorkspaceListEmptyView,

  bindShortcuts: function () {
    WorkspaceListView.prototype.bindShortcuts.apply(this, arguments);
    var that = this;
    key('right', 'list', function () {
      that.options.app.controller.showDetailsForSelected();
      return false;
    });
    key('a', function () {
      that.options.app.controller.activateCurrent();
      return false;
    });
    key('d', function () {
      that.options.app.controller.deactivateCurrent();
      return false;
    });
  }
});


