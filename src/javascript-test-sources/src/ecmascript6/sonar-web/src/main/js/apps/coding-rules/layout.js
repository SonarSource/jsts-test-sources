import $ from 'jquery';
import Marionette from 'backbone.marionette';
import Template from './templates/coding-rules-layout.hbs';

export default Marionette.LayoutView.extend({
  template: Template,

  regions: {
    filtersRegion: '.search-navigator-filters',
    facetsRegion: '.search-navigator-facets',
    workspaceHeaderRegion: '.search-navigator-workspace-header',
    workspaceListRegion: '.search-navigator-workspace-list',
    workspaceDetailsRegion: '.search-navigator-workspace-details'
  },

  onRender: function () {
    var navigator = this.$('.search-navigator');
    var top = navigator.offset().top;
    this.$('.search-navigator-workspace-header').css({ top: top });
    this.$('.search-navigator-side').css({ top: top }).isolatedScroll();
  },

  showDetails: function () {
    this.scroll = $(window).scrollTop();
    this.$('.search-navigator').addClass('search-navigator-extended-view');
  },


  hideDetails: function () {
    this.$('.search-navigator').removeClass('search-navigator-extended-view');
    if (this.scroll != null) {
      $(window).scrollTop(this.scroll);
    }
  },

  detailsShow: function () {
    return this.$('.search-navigator').is('.search-navigator-extended-view');
  }

});


