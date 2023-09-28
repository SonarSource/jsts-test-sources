suite('p5.Font', function() {
  var myp5;

  setup(function(done) {
    new p5(function(p) {
      p.setup = function() {
        myp5 = p;
        done();
      };
    });
  });

  teardown(function() {
    myp5.remove();
  });

  suite('p5.Font.prototype.textBounds', function() {
    test('returns a tight bounding box for the given text string', async function() {
      let fontFile = 'manual-test-examples/p5.Font/acmesa.ttf';
      const bbox = await promisedSketch(function(sketch, resolve, reject) {
        let _font;
        let textString = 'Lorem ipsum dolor sit amet.';
        sketch.preload = function() {
          _font = sketch.loadFont(fontFile, function() {}, reject);
        };
        sketch.setup = function() {
          let _bbox = _font.textBounds(textString, 10, 30, 12);
          resolve(_bbox);
        };
      });
      assert.isObject(bbox);
      assert.property(bbox, 'x');
      assert.property(bbox, 'y');
      assert.property(bbox, 'w');
      assert.property(bbox, 'h');
    });
  });

  suite('p5.Font.prototype.textToPoints', function() {
    test('returns array of points', async function() {
      let fontFile = 'manual-test-examples/p5.Font/acmesa.ttf';
      const points = await promisedSketch(function(sketch, resolve, reject) {
        let _font;
        sketch.preload = function() {
          _font = sketch.loadFont(fontFile, function() {}, reject);
        };
        sketch.setup = function() {
          let _points = _font.textToPoints('p5', 0, 0, 10, {
            sampleFactor: 5,
            simplifyThreshold: 0
          });
          resolve(_points);
        };
      });
      assert.isArray(points);
      points.forEach(p => {
        assert.property(p, 'x');
        assert.property(p, 'y');
        assert.property(p, 'alpha');
      });
    });
  });
});
