/*globals describe, before, after, it*/
/*jshint expr:true*/
var should         = require('should'),
    hbs            = require('express-hbs'),
    utils          = require('./utils'),
    configUtils    = require('../../utils/configUtils'),

// Stuff we are testing
    handlebars     = hbs.handlebars,
    helpers        = require('../../../server/helpers');

describe('{{meta_title}} helper', function () {
    before(function () {
        utils.loadHelpers();
        configUtils.set({
            theme: {
                title: 'Ghost'
            }
        });
    });

    after(function () {
        configUtils.restore();
    });

    it('has loaded meta_title helper', function () {
        should.exist(handlebars.helpers.meta_title);
    });

    it('returns correct title for homepage', function () {
        var rendered = helpers.meta_title.call(
            {},
            {data: {root: {context: ['home']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Ghost');
    });

    it('returns correct title for paginated page', function () {
        var rendered = helpers.meta_title.call(
            {},
            {data: {root: {context: [], pagination: {total: 2, page: 2}}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Ghost - Page 2');
    });

    it('returns correct title for a post', function () {
        var rendered = helpers.meta_title.call(
            {post: {title: 'Post Title'}},
            {data: {root: {context: ['post']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Post Title');
    });

    it('returns correct title for a post with meta_title set', function () {
        var rendered = helpers.meta_title.call(
            {post: {title: 'Post Title', meta_title: 'Awesome Post'}},
            {data: {root: {context: ['post']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Awesome Post');
    });

    it('returns correct title for a page with meta_title set', function () {
        var rendered = helpers.meta_title.call(
            {post: {title: 'About Page', meta_title: 'All about my awesomeness', page: true}},
            {data: {root: {context: ['page']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('All about my awesomeness');
    });

    it('returns correct title for a tag page', function () {
        var tag = {relativeUrl: '/tag/rasper-red', tag: {name: 'Rasper Red'}},
            rendered = helpers.meta_title.call(
                tag,
                {data: {root: {context: ['tag']}}}
            );

        should.exist(rendered);
        String(rendered).should.equal('Rasper Red - Ghost');
    });

    it('returns correct title for a paginated tag page', function () {
        var rendered = helpers.meta_title.call(
            {tag: {name: 'Rasper Red'}},
            {data: {root: {context: ['tag', 'paged'], pagination: {total: 2, page: 2}}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Rasper Red - Page 2 - Ghost');
    });

    it('uses tag meta_title to override default response on tag page', function () {
        var rendered = helpers.meta_title.call(
            {tag: {name: 'Rasper Red', meta_title: 'Sasper Red'}},
            {data: {root: {context: ['tag']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Sasper Red');
    });

    it('uses tag meta_title to override default response on paginated tag page', function () {
        var rendered = helpers.meta_title.call(
            {tag: {name: 'Rasper Red', meta_title: 'Sasper Red'}},
            {data: {root: {context: ['tag']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Sasper Red');
    });

    it('returns correct title for an author page', function () {
        var rendered = helpers.meta_title.call(
            {author: {name: 'Donald Duck'}},
            {data: {root: {context: ['author']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Donald Duck - Ghost');
    });

    it('returns correct title for a paginated author page', function () {
        var rendered = helpers.meta_title.call(
            {author: {name: 'Donald Duck'}},
            {data: {root: {context: ['author', 'paged'], pagination: {total: 2, page: 2}}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Donald Duck - Page 2 - Ghost');
    });

    it('returns correctly escaped title of a post', function () {
        var rendered = helpers.meta_title.call(
            {post: {title: 'Post Title "</>'}},
            {data: {root: {context: ['post']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Post Title "</>');
    });

    it('returns meta_title on post when used within {{#foreach posts}}', function () {
        var rendered = helpers.meta_title.call(
            {meta_title: 'Awesome Post'},
            {data: {root: {context: ['home']}}}
        );

        should.exist(rendered);
        String(rendered).should.equal('Awesome Post');
    });
});
