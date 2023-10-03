import $ from 'jquery';
import Handlebars from 'hbsfy/runtime';
import ChangePasswordView from './change-password-view';
import '../../helpers/handlebars-helpers';

var shouldShowAvatars = window.SS && window.SS.lf && window.SS.lf.enableGravatar;
var favorites = $('.js-account-favorites tr');

function showExtraFavorites () {
  favorites.removeClass('hidden');
}

class App {
  start () {
    $('html').addClass('dashboard-page');

    if (shouldShowAvatars) {
      var avatarHtml = Handlebars.helpers.avatarHelper(window.SS.userEmail, 100).string;
      $('.js-avatar').html(avatarHtml);
    }

    $('.js-show-all-favorites').on('click', function (e) {
      e.preventDefault();
      $(e.currentTarget).hide();
      showExtraFavorites();
    });

    $('#account-change-password-trigger').on('click', function (e) {
      e.preventDefault();
      new ChangePasswordView().render();
    });
  }
}

window.sonarqube.appStarted.then(options => new App().start(options));
