import Ember from 'ember';
import ghostPaths from 'ghost/utils/ghost-paths';

const {$} = Ember;

let Ghost = ghostPaths();

let UploadUi = function ($dropzone, settings) {
    let $url = '<div class="js-url"><input class="url js-upload-url gh-input" type="url" placeholder="http://"/></div>';
    let $cancel = '<a class="image-cancel icon-trash js-cancel" title="Delete"><span class="hidden">Delete</span></a>';
    let $progress =  $('<div />', {
            class: 'js-upload-progress progress progress-success active',
            role: 'progressbar',
            'aria-valuemin': '0',
            'aria-valuemax': '100'
        }).append($('<div />', {
            class: 'js-upload-progress-bar bar',
            style: 'width:0%'
        }));

    $.extend(this, {
        complete: (result) => {
            let showImage = (width, height) => {
                $dropzone.find('img.js-upload-target').attr({width, height}).css({display: 'block'});
                $dropzone.find('.fileupload-loading').remove();
                $dropzone.css({height: 'auto'});
                $dropzone.delay(250).animate({opacity: 100}, 1000, () => {
                    $('.js-button-accept').prop('disabled', false);
                    this.init();
                });
            };

            let animateDropzone = ($img) => {
                $dropzone.animate({opacity: 0}, 250, () => {
                    $dropzone.removeClass('image-uploader').addClass('pre-image-uploader');
                    this.removeExtras();
                    $dropzone.animate({height: $img.height()}, 250, () => {
                        showImage($img.width(), $img.height());
                    });
                });
            };

            let preLoadImage = () => {
                let $img = $dropzone.find('img.js-upload-target')
                    .attr({src: '', width: 'auto', height: 'auto'});

                $progress.animate({opacity: 0}, 250, () => {
                    $dropzone.find('span.media').after(`<img class="fileupload-loading" src="${Ghost.subdir}/ghost/img/loadingcat.gif" />`);
                });
                $img.one('load', () => {
                    $dropzone.trigger('uploadsuccess', [result]);
                    animateDropzone($img);
                }).attr('src', result);
            };
            preLoadImage();
        },

        bindFileUpload() {
            $dropzone.find('.js-fileupload').fileupload().fileupload('option', {
                url: `${Ghost.apiRoot}/uploads/`,
                add(e, data) {
                    /*jshint unused:false*/
                    $('.js-button-accept').prop('disabled', true);
                    $dropzone.find('.js-fileupload').removeClass('right');
                    $dropzone.find('.js-url').remove();
                    $progress.find('.js-upload-progress-bar').removeClass('fail');
                    $dropzone.trigger('uploadstart', [$dropzone.attr('id')]);
                    $dropzone.find('span.media, div.description, a.image-url, a.image-webcam')
                        .animate({opacity: 0}, 250, () => {
                            $dropzone.find('div.description').hide().css({opacity: 100});
                            if (settings.progressbar) {
                                $dropzone.find('div.js-fail').after($progress);
                                $progress.animate({opacity: 100}, 250);
                            }
                            data.submit();
                        });
                },
                dropZone: settings.fileStorage ? $dropzone : null,
                progressall(e, data) {
                    /*jshint unused:false*/
                    let progress = parseInt(data.loaded / data.total * 100, 10);
                    if (settings.progressbar) {
                        $dropzone.trigger('uploadprogress', [progress, data]);
                        $progress.find('.js-upload-progress-bar').css('width', `${progress}%`);
                    }
                },
                fail: (e, data) => {
                    /*jshint unused:false*/
                    $('.js-button-accept').prop('disabled', false);
                    $dropzone.trigger('uploadfailure', [data.result]);
                    $dropzone.find('.js-upload-progress-bar').addClass('fail');
                    if (data.jqXHR.status === 413) {
                        $dropzone.find('div.js-fail').text('The image you uploaded was larger than the maximum file size your server allows.');
                    } else if (data.jqXHR.status === 415) {
                        $dropzone.find('div.js-fail').text('The image type you uploaded is not supported. Please use .PNG, .JPG, .GIF, .SVG.');
                    } else {
                        $dropzone.find('div.js-fail').text('Something went wrong :(');
                    }
                    $dropzone.find('div.js-fail, button.js-fail').fadeIn(1500);
                    $dropzone.find('button.js-fail').on('click', () => {
                        $dropzone.css({minHeight: 0});
                        $dropzone.find('div.description').show();
                        this.removeExtras();
                        this.init();
                    });
                },
                done: (e, data) => {
                    /*jshint unused:false*/
                    this.complete(data.result);
                }
            });
        },

        buildExtras() {
            if (!$dropzone.find('span.media')[0]) {
                $dropzone.prepend('<span class="media"><span class="hidden">Image Upload</span></span>');
            }
            if (!$dropzone.find('div.description')[0]) {
                $dropzone.append('<div class="description">Add image</div>');
            }
            if (!$dropzone.find('div.js-fail')[0]) {
                $dropzone.append('<div class="js-fail failed" style="display: none">Something went wrong :(</div>');
            }
            if (!$dropzone.find('button.js-fail')[0]) {
                $dropzone.append('<button class="js-fail btn btn-green" style="display: none">Try Again</button>');
            }
            if (!$dropzone.find('a.image-url')[0]) {
                $dropzone.append('<a class="image-url" title="Add image from URL"><i class="icon-link"><span class="hidden">URL</span></i></a>');
            }
            // if (!$dropzone.find('a.image-webcam')[0]) {
            //     $dropzone.append('<a class="image-webcam" title="Add image from webcam"><span class="hidden">Webcam</span></a>');
            // }
        },

        removeExtras() {
            $dropzone.find('span.media, div.js-upload-progress, a.image-url, a.image-upload, a.image-webcam, div.js-fail, button.js-fail, a.js-cancel, button.js-button-accept').remove();
        },

        initWithDropzone() {
            // This is the start point if no image exists
            $dropzone.find('img.js-upload-target').css({display: 'none'});
            $dropzone.find('div.description').show();
            $dropzone.removeClass('pre-image-uploader image-uploader-url').addClass('image-uploader');
            this.removeExtras();
            this.buildExtras();
            this.bindFileUpload();
            if (!settings.fileStorage) {
                this.initUrl();
                return;
            }
            $dropzone.find('a.image-url').on('click', () => {
                this.initUrl();
            });
        },
        initUrl() {
            this.removeExtras();
            $dropzone.addClass('image-uploader-url').removeClass('pre-image-uploader');
            $dropzone.find('.js-fileupload').addClass('right');
            $dropzone.find('.js-cancel').on('click', () => {
                $dropzone.find('.js-url').remove();
                $dropzone.find('.js-fileupload').removeClass('right');
                $dropzone.trigger('imagecleared');
                this.removeExtras();
                this.initWithDropzone();
            });

            if (!$dropzone.find('.js-url')[0]) {
                $dropzone.find('div.description').before($url);
            }

            if (settings.editor) {
                $dropzone.find('div.js-url').append('<button class="btn btn-blue js-button-accept gh-input">Save</button>');
                $dropzone.find('div.description').hide();
            }

            $dropzone.find('.js-button-accept').on('click', () => {
                let val = $dropzone.find('.js-upload-url').val();

                $dropzone.find('div.description').hide();
                $dropzone.find('.js-fileupload').removeClass('right');
                $dropzone.find('.js-url').remove();
                if (val === '') {
                    $dropzone.trigger('uploadsuccess', 'http://');
                    this.initWithDropzone();
                } else {
                    this.complete(val);
                }
            });

            // Only show the toggle icon if there is a dropzone mode to go back to
            if (settings.fileStorage !== false) {
                $dropzone.append('<a class="image-upload icon-photos" title="Add image"><span class="hidden">Upload</span></a>');
            }

            $dropzone.find('a.image-upload').on('click', () => {
                $dropzone.find('.js-url').remove();
                $dropzone.find('.js-fileupload').removeClass('right');
                this.initWithDropzone();
            });
        },

        initWithImage() {
            // This is the start point if an image already exists
            this.removeExtras();
            $dropzone.removeClass('image-uploader image-uploader-url').addClass('pre-image-uploader');
            $dropzone.find('div.description').hide();
            $dropzone.find('img.js-upload-target').show();
            $dropzone.append($cancel);
            $dropzone.find('.js-cancel').on('click', () => {
                $dropzone.find('img.js-upload-target').attr({src: ''});
                $dropzone.find('div.description').show();
                $dropzone.trigger('imagecleared');

                $dropzone.trigger('uploadsuccess', 'http://');
                this.initWithDropzone();
            });
        },

        init() {
            let imageTarget = $dropzone.find('img.js-upload-target');
            // First check if field image is defined by checking for js-upload-target class
            if (!imageTarget[0]) {
                // This ensures there is an image we can hook into to display uploaded image
                $dropzone.prepend('<img class="js-upload-target" style="display: none"  src="" />');
            }
            $('.js-button-accept').prop('disabled', false);
            if (imageTarget.attr('src') === '' || imageTarget.attr('src') === undefined) {
                this.initWithDropzone();
            } else {
                this.initWithImage();
            }
        },

        reset() {
            $dropzone.find('.js-url').remove();
            $dropzone.find('.js-fileupload').removeClass('right');
            this.removeExtras();
            this.initWithDropzone();
        }
    });
};

export default function (options) {
    let settings = $.extend({
        progressbar: true,
        editor: false,
        fileStorage: true
    }, options);

    return this.each(function () {
        let $dropzone = $(this);
        let ui = new UploadUi($dropzone, settings);
        $(this).attr('data-uploaderui', true);
        this.uploaderUi = ui;
        ui.init();
    });
}
