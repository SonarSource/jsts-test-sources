import ModalForm from '../../components/common/modal-form';
import Template from './templates/users-deactivate.hbs';

export default ModalForm.extend({
  template: Template,

  onFormSubmit: function (e) {
    this._super(e);
    this.sendRequest();
  },

  sendRequest: function () {
    var that = this,
        collection = this.model.collection;
    return this.model.destroy({
      wait: true,
      statusCode: {
        // do not show global error
        400: null
      }
    }).done(function () {
      collection.total--;
      that.destroy();
    }).fail(function (jqXHR) {
      that.showErrors(jqXHR.responseJSON.errors, jqXHR.responseJSON.warnings);
    });
  }
});


