/*globals describe, before, beforeEach, afterEach, it*/
/*jshint expr:true*/
var should          = require('should'),
    sinon           = require('sinon'),
    rewire          = require('rewire'),
    _               = require('lodash'),
    Promise         = require('bluebird'),
    testUtils       = require('../utils'),

    channelConfig   = require('../../server/controllers/frontend/channel-config'),

    // Things that get overridden
    api             = require('../../server/api'),
    rss             = rewire('../../server/data/xml/rss'),

    configUtils     = require('../utils/configUtils');

// To stop jshint complaining
should.equal(true, true);

// Helper function to prevent unit tests
// from failing via timeout when they
// should just immediately fail
function failTest(done) {
    return function (err) {
        done(err);
    };
}

describe('RSS', function () {
    var sandbox, req, res, posts;

    before(function () {
        posts = _.filter(testUtils.DataGenerator.forKnex.posts, function filter(post) {
            return post.status === 'published' && post.page === false;
        });

        _.each(posts, function (post) {
            post.url = '/' + post.slug + '/';
            post.author = {name: 'Joe Bloggs'};
        });
    });

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
        rss = rewire('../../server/data/xml/rss');
        configUtils.restore();
    });

    describe('Check XML', function () {
        beforeEach(function () {
            req = {
                params: {},
                originalUrl: '/rss/'
            };

            res = {
                locals: {
                    safeVersion: '0.6'
                },
                set: sinon.stub()
            };

            configUtils.set({url: 'http://my-ghost-blog.com'});
        });

        it('should get the RSS tags correct', function (done) {
            rss.__set__('getData', function () {
                return Promise.resolve({
                    title: 'Test Title',
                    description: 'Testing Desc',
                    permalinks: '/:slug/',
                    results: {posts: [], meta: {pagination: {pages: 1}}}
                });
            });

            res.send = function send(xmlData) {
                should.exist(xmlData);
                res.set.calledWith('Content-Type', 'text/xml; charset=UTF-8').should.be.true;

                // xml & rss tags
                xmlData.should.match(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
                xmlData.should.match(/<rss/);
                xmlData.should.match(/xmlns:dc="http:\/\/purl.org\/dc\/elements\/1.1\/"/);
                xmlData.should.match(/xmlns:content="http:\/\/purl.org\/rss\/1.0\/modules\/content\/"/);
                xmlData.should.match(/xmlns:atom="http:\/\/www.w3.org\/2005\/Atom"/);
                xmlData.should.match(/version="2.0"/);
                xmlData.should.match(/xmlns:media="http:\/\/search.yahoo.com\/mrss\/"/);

                // channel tags
                xmlData.should.match(/<channel><title><!\[CDATA\[Test Title\]\]><\/title>/);
                xmlData.should.match(/<description><!\[CDATA\[Testing Desc\]\]><\/description>/);
                xmlData.should.match(/<link>http:\/\/my-ghost-blog.com\/<\/link>/);
                xmlData.should.match(/<generator>Ghost 0.6<\/generator>/);
                xmlData.should.match(/<lastBuildDate>.*?<\/lastBuildDate>/);
                xmlData.should.match(/<atom:link href="http:\/\/my-ghost-blog.com\/rss\/" rel="self"/);
                xmlData.should.match(/type="application\/rss\+xml"\/><ttl>60<\/ttl>/);
                xmlData.should.match(/<\/channel><\/rss>$/);

                done();
            };

            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;
            rss(req, res, failTest(done));
        });

        it('should get the item tags correct', function (done) {
            rss.__set__('getData', function () {
                return Promise.resolve({
                    title: 'Test Title',
                    description: 'Testing Desc',
                    permalinks: '/:slug/',
                    results: {posts: posts, meta: {pagination: {pages: 1}}}
                });
            });

            res.send = function send(xmlData) {
                should.exist(xmlData);

                // item tags
                xmlData.should.match(/<item><title><!\[CDATA\[HTML Ipsum\]\]><\/title>/);
                xmlData.should.match(/<description><!\[CDATA\[<h1>HTML Ipsum Presents<\/h1>/);
                xmlData.should.match(/<link>http:\/\/my-ghost-blog.com\/html-ipsum\/<\/link>/);
                xmlData.should.match(/<guid isPermaLink="false">/);
                xmlData.should.match(/<\/guid><dc:creator><!\[CDATA\[Joe Bloggs\]\]><\/dc:creator>/);
                xmlData.should.match(/<pubDate>Thu, 01 Jan 2015/);
                xmlData.should.match(/<content:encoded><!\[CDATA\[<h1>HTML Ipsum Presents<\/h1><p><strong>Pellentes/);
                xmlData.should.match(/<\/code><\/pre>\]\]><\/content:encoded><\/item>/);
                xmlData.should.not.match(/<author>/);

                // basic structure check
                var postEnd = '<\/code><\/pre>\]\]><\/content:encoded>',
                    firstIndex = xmlData.indexOf(postEnd);

                // The first title should be before the first content
                xmlData.indexOf('HTML Ipsum').should.be.below(firstIndex);
                // The second title should be after the first content
                xmlData.indexOf('Ghostly Kitchen Sink').should.be.above(firstIndex);

                // done
                done();
            };

            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;
            rss(req, res, failTest(done));
        });

        it('should use meta_description and image where available', function (done) {
            rss.__set__('getData', function () {
                return Promise.resolve({
                    title: 'Test Title',
                    description: 'Testing Desc',
                    permalinks: '/:slug/',
                    results: {posts: [posts[2]], meta: {pagination: {pages: 1}}}
                });
            });

            res.send = function send(xmlData) {
                should.exist(xmlData);

                // special/optional tags
                xmlData.should.match(/<title><!\[CDATA\[Short and Sweet\]\]>/);
                xmlData.should.match(/<description><!\[CDATA\[test stuff/);
                xmlData.should.match(/<content:encoded><!\[CDATA\[<h2 id="testing">testing<\/h2>\n\n/);
                xmlData.should.match(/<img src="http:\/\/placekitten.com\/500\/200"/);
                xmlData.should.match(/<media:content url="http:\/\/placekitten.com\/500\/200" medium="image"\/>/);

                // done
                done();
            };

            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;
            rss(req, res, failTest(done));
        });

        it('should process urls correctly', function (done) {
            rss.__set__('getData', function () {
                return Promise.resolve({
                    title: 'Test Title',
                    description: 'Testing Desc',
                    permalinks: '/:slug/',
                    results: {posts: [posts[3]], meta: {pagination: {pages: 1}}}
                });
            });

            res.send = function send(xmlData) {
                should.exist(xmlData);

                // anchor URL - <a href="#nowhere" title="Anchor URL">
                xmlData.should.match(/<a href="http:\/\/my-ghost-blog.com\/not-so-short-bit-complex\/#nowhere" title="Anchor URL">/);

                // relative URL - <a href="/about#nowhere" title="Relative URL">
                xmlData.should.match(/<a href="http:\/\/my-ghost-blog.com\/about#nowhere" title="Relative URL">/);

                // protocol relative URL - <a href="//somewhere.com/link#nowhere" title="Protocol Relative URL">
                xmlData.should.match(/<a href="\/\/somewhere.com\/link#nowhere" title="Protocol Relative URL">/);

                // absolute URL - <a href="http://somewhere.com/link#nowhere" title="Absolute URL">
                xmlData.should.match(/<a href="http:\/\/somewhere.com\/link#nowhere" title="Absolute URL">/);

                // done
                done();
            };

            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;
            rss(req, res, failTest(done));
        });

        it('should process urls correctly with subdirectory', function (done) {
            configUtils.set({url: 'http://my-ghost-blog.com/blog/'});
            rss.__set__('getData', function () {
                return Promise.resolve({
                    title: 'Test Title',
                    description: 'Testing Desc',
                    permalinks: '/:slug/',
                    results: {posts: [posts[3]], meta: {pagination: {pages: 1}}}
                });
            });

            res.send = function send(xmlData) {
                should.exist(xmlData);

                // anchor URL - <a href="#nowhere" title="Anchor URL">
                xmlData.should.match(/<a href="http:\/\/my-ghost-blog.com\/blog\/not-so-short-bit-complex\/#nowhere" title="Anchor URL">/);

                // relative URL - <a href="/about#nowhere" title="Relative URL">
                xmlData.should.match(/<a href="http:\/\/my-ghost-blog.com\/blog\/about#nowhere" title="Relative URL">/);

                // absolute URL - <a href="http://somewhere.com/link#nowhere" title="Absolute URL">
                xmlData.should.match(/<a href="http:\/\/somewhere.com\/link#nowhere" title="Absolute URL">/);

                // done
                done();
            };

            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;
            rss(req, res, failTest(done));
        });
    });

    describe('dataBuilder', function () {
        var apiBrowseStub, apiTagStub, apiUserStub;
        beforeEach(function () {
            apiBrowseStub = sandbox.stub(api.posts, 'browse', function () {
                return Promise.resolve({posts: [], meta: {pagination: {pages: 3}}});
            });

            apiTagStub = sandbox.stub(api.tags, 'read', function () {
                return Promise.resolve({tags: [{name: 'Magic'}]});
            });

            apiUserStub = sandbox.stub(api.users, 'read', function () {
                return Promise.resolve({users: [{name: 'Joe Blogs'}]});
            });

            req = {
                params: {},
                originalUrl: '/rss/'
            };

            res = {
                locals: {
                    safeVersion: '0.6'
                },
                set: sinon.stub()
            };

            configUtils.set({url: 'http://my-ghost-blog.com', theme: {
                title: 'Test',
                description: 'Some Text',
                permalinks: '/:slug/'
            }});
        });

        it('should process the data correctly for the index feed', function (done) {
            res.send = function send(xmlData) {
                apiBrowseStub.calledOnce.should.be.true;
                apiBrowseStub.calledWith({page: 1, include: 'author,tags,fields'}).should.be.true;
                xmlData.should.match(/<channel><title><!\[CDATA\[Test\]\]><\/title>/);
                done();
            };

            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;
            rss(req, res, failTest(done));
        });

        it('should process the data correctly for a tag feed', function (done) {
            // setup
            req.originalUrl = '/tag/magic/rss/';
            req.params.slug = 'magic';
            req.channelConfig = channelConfig('tag');
            req.channelConfig.isRSS = true;

            // test
            res.send = function send(xmlData) {
                apiBrowseStub.calledOnce.should.be.true;
                apiBrowseStub.calledWith({page: 1, filter: 'tags:\'magic\'', include: 'author,tags,fields'}).should.be.true;
                apiTagStub.calledOnce.should.be.true;
                xmlData.should.match(/<channel><title><!\[CDATA\[Magic - Test\]\]><\/title>/);
                done();
            };

            rss(req, res, failTest(done));
        });

        it('should process the data correctly for an author feed', function (done) {
            req.originalUrl = '/author/joe/rss/';
            req.params.slug = 'joe';
            req.channelConfig = channelConfig('author');
            req.channelConfig.isRSS = true;

            // test
            res.send = function send(xmlData) {
                apiBrowseStub.calledOnce.should.be.true;
                apiBrowseStub.calledWith({page: 1, filter: 'author:\'joe\'', include: 'author,tags,fields'}).should.be.true;
                apiUserStub.calledOnce.should.be.true;
                xmlData.should.match(/<channel><title><!\[CDATA\[Joe Blogs - Test\]\]><\/title>/);
                done();
            };

            rss(req, res, failTest(done));
        });
    });

    describe('caching', function () {
        beforeEach(function () {
            req = {
                params: {},
                originalUrl: '/rss/'
            };

            res = {
                locals: {
                    safeVersion: '0.6'
                },
                set: sinon.stub()
            };

            configUtils.set({url: 'http://my-ghost-blog.com'});
        });

        it('should not rebuild xml for same data and url', function (done) {
            var xmlData;
            rss.__set__('getData', function () {
                return Promise.resolve({
                    title: 'Test Title',
                    description: 'Testing Desc',
                    permalinks: '/:slug/',
                    results: {posts: [], meta: {pagination: {pages: 1}}}
                });
            });
            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;

            function secondCall() {
                res.send = function sendFirst(data) {
                    // The data should be identical, no changing lastBuildDate
                    data.should.equal(xmlData);

                    // Now call done!
                    done();
                };

                rss(req, res, failTest(done));
            }

            function firstCall() {
                res.send = function sendFirst(data) {
                    xmlData = data;

                    // Call RSS again to check that we didn't rebuild
                    secondCall();
                };

                rss(req, res, failTest(done));
            }

            firstCall();
        });
    });

    describe('pagination', function () {
        beforeEach(function () {
            res = {
                locals: {version: ''},
                redirect: sandbox.spy(),
                render: sandbox.spy()
            };

            rss.__set__('getData', function () {
                return Promise.resolve({
                    title: 'Test',
                    description: 'Testing',
                    permalinks: '/:slug/',
                    results: {posts: [], meta: {pagination: {pages: 3}}}
                });
            });
        });

        it('Should 404 if page number too big', function (done) {
            configUtils.set({url: 'http://testurl.com/'});

            req = {params: {page: 4}, route: {path: '/rss/:page/'}};
            req.originalUrl = req.route.path.replace(':page', req.params.page);
            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;

            rss(req, res, function (err) {
                should.exist(err);
                err.code.should.eql(404);
                res.redirect.called.should.be.false;
                res.render.called.should.be.false;
                done();
            }).catch(done);
        });

        it('Redirects to last page if page number too big with subdirectory', function (done) {
            configUtils.set({url: 'http://testurl.com/blog'});

            req = {params: {page: 4}, route: {path: '/rss/:page/'}};
            req.originalUrl = req.route.path.replace(':page', req.params.page);
            req.channelConfig = channelConfig('index');
            req.channelConfig.isRSS = true;

            rss(req, res, function (err) {
                should.exist(err);
                err.code.should.eql(404);
                res.redirect.called.should.be.false;
                res.render.called.should.be.false;
                done();
            }).catch(done);
        });
    });
});
