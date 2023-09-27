import {use, inject} from 'di/testing';
import {Compiler} from '../../../src/lib/compiler/compiler';
import {Selector} from '../../../src/lib/compiler/selector';
import {DirectiveClass} from '../../../src/lib/compiler/directive_class';
import {TemplateDirective, DecoratorDirective, ComponentDirective} from '../../../src/lib/annotations';
import {$, $0, $html} from '../dom_mocks';

describe('Compiler', () => {
  var directives,
      binders,
      container,
      attrDirectiveAnnotations;

  it('should not reparent nodes', inject(Compiler, (compiler)=>{
    createSelector();
    var container = $('<div>a</div>')[0];
    var node = container.childNodes[0];
    compiler.compileChildNodes(container, directives);
    expect(node.parentNode).toBe(container);
  }));

  describe('mark nodes with directives and collect binders', ()=> {
    it('should work for one element', function() {
      createSelector([ new DecoratorDirective({selector: '[name]'}) ]);

      // all possible combinations of elements with decorators and elements
      // without decorators
      compileAndVerifyBinders('<div></div>', '()');
      compileAndVerifyBinders('<div name="1"></div>', '(),1()');
    });

    it('should work for two sibling elements', function() {
      createSelector([ new DecoratorDirective({selector: '[name]'}) ]);

      // all possible combinations of elements with decorators and elements
      // without decorators
      compileAndVerifyBinders('<div></div><div></div>', '()');
      compileAndVerifyBinders('<div name="1"></div><div></div>', '(),1()');
      compileAndVerifyBinders('<div></div><div name="1"></div>', '(),1()');
      compileAndVerifyBinders('<div name="1"></div><div name="2"></div>', '(),1(),2()');
    });

    it('should work for nested elements', function() {
      createSelector([ new DecoratorDirective({selector: '[name]'}) ]);

      // all possible combinations of elements with decorators and elements
      // without decorators
      compileAndVerifyBinders('<div><span></span></div>', '()');
      compileAndVerifyBinders('<div name="1"><span></span></div>', '(),1()');
      compileAndVerifyBinders('<div><span name="1"></span></div>', '(),1()');
      compileAndVerifyBinders('<div name="1"><span name="2"></span></div>', '(),1(),2()');
      compileAndVerifyBinders('<div><span name="1"></span><span></span></div>', '(),1()');
      compileAndVerifyBinders('<div><span></span><span name="1"></span></div>', '(),1()');
    });

    it('should set the correct tree levels in the element binders', ()=>{
      createSelector([ new DecoratorDirective({selector: '[name]'}) ]);
      compile('<a name="1"><b name="2"></b></a><a name="3"></a>');
      expect(stringifyBinderLevels()).toBe('0,1,2,1');
    });

  });

  describe('compile text nodes', ()=>{
    it('should create TextBinders for text nodes', ()=>{
      createSelector();

      // different combinations of where interpolated text nodes can be
      compileAndVerifyBinders('', '()');
      compileAndVerifyBinders('a', '()');
      compileAndVerifyBinders('{{a}}', '({{a}})');
      compileAndVerifyBinders('<span>a</span>', '()');
      compileAndVerifyBinders('{{a}}<span>{{b}}</span>{{c}}', '({{a}},{{c}}),({{b}})');
      compileAndVerifyBinders('<span>{{a}}</span>', '(),({{a}})');
      compileAndVerifyBinders('<span><div></div>{{a}}</span>', '(),({{a}})');
      compileAndVerifyBinders('<span>{{a}}<div></div>{{b}}</span>', '(),({{a}},{{b}})');
      compileAndVerifyBinders('<span>{{a}}<div>{{b}}</div>{{c}}</span>', '(),({{a}},{{c}}),({{b}})');
    });

    it('should add TextBinders to the right ElementBinders and not just the latest created ElementBinder', ()=>{
      createSelector([ new DecoratorDirective({selector: '[name]'}) ]);

      compileAndVerifyBinders('<span name="1">{{a}}<span name="2"></span>{{b}}</span>', '(),1({{a}},{{b}}),2()');
    });
  });

  describe('compile with a component directives', () => {

    it('should compile with a given component viewFactory', ()=>{
      var compAnnotation = new ComponentDirective({selector: '[comp]', template: null});
      createSelector([
          new DecoratorDirective({selector: '[name]'}),
          compAnnotation
      ]);
      compile('<div comp></div>');
      verifyBinders('(),()');
      expect(binders[1].component).toBeTruthy();
    });

    it('should not use the component for sibling elements', ()=>{
      createSelector([
          new ComponentDirective({selector: '[comp]', template: null})
      ]);
      compile('<div comp></div><div></div>');
      // root binder and component, nothing else
      verifyBinders('(),()');
    });

  });

  describe('compile template directives', () => {

    describe('on a non template element', ()=>{

      it('should create the correct template viewFactory and template nodes', ()=>{
        createSelector([
          new DecoratorDirective({selector: '[name]'}),
          new TemplateDirective({selector: '[tpl]'})
        ]);
        // template directive is on root node
        compile('<div tpl>a</div>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<template class="ng-binder"></template>');
        switchToTemplateDirective();
        verifyBinders('()');
        expect($html(container.childNodes)).toBe('<div tpl="">a</div>');

        // template directive is on child node
        compile('<div><span tpl>a</span></div>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<div><template class="ng-binder"></template></div>');
        switchToTemplateDirective();
        verifyBinders('()');
        expect($html(container.childNodes)).toBe('<span tpl="">a</span>');

        // template is after another text node
        compile('<div>a<span tpl>b</span></div>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<div>a<template class="ng-binder"></template></div>');
        switchToTemplateDirective();
        verifyBinders('()');
        expect($html(container.childNodes)).toBe('<span tpl="">b</span>');

        // template has other directives on same node
        compile('<div><span tpl name="1">a</span></div>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<div><template class="ng-binder"></template></div>');
        switchToTemplateDirective();
        verifyBinders('(),1()');
        expect($html(container.childNodes)).toBe('<span tpl="" name="1" class="ng-binder">a</span>');

        // template contains other directives on child elements
        compile('<div tpl=""><span name="1">a</span></div>');
        verifyBinders('(),()');
        switchToTemplateDirective();
        verifyBinders('(),1()');
        expect($html(container.childNodes)).toBe('<div tpl=""><span name="1" class="ng-binder">a</span></div>');

      });

      it('should split the nodeAttrs and keep the attributes for the bound properties on the template directive', ()=>{
        createSelector([
          new TemplateDirective({selector: '[tpl]', bind: {'tpl': 'someProp', 'b':'someOtherProp'}})
        ]);
        compile('<div tpl="a" bind-b="c" x="y" bind-d="e"></div>');

        var templateBinder = binders[1];
        expect(templateBinder.attrs.init).toEqual({
          tpl: 'a', x: 'y'
        });
        expect(templateBinder.attrs.bind).toEqual({
          b: 'c'
        });

        switchToTemplateDirective();
        var elBinder = binders[1];
        expect(elBinder.attrs.init).toEqual(templateBinder.attrs.init);
        expect(elBinder.attrs.bind).toEqual({
          d: 'e'
        });
      });

    });

    describe('on a template element', ()=>{

      it('should create the correct template viewFactory and template nodes', ()=>{
        createSelector([
          new DecoratorDirective({selector: '[name]'}),
          new TemplateDirective({selector: '[tpl]'})
        ]);

        // template directive is on root node
        compile('<template tpl>a</tempate>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<template class="ng-binder"></template>');
        switchToTemplateDirective();
        verifyBinders('()');
        expect($html(container.childNodes)).toBe('a');

        // template directive is on child node
        compile('<div><template tpl>a</template></div>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<div><template class="ng-binder"></template></div>');
        switchToTemplateDirective();
        verifyBinders('()');
        expect($html(container.childNodes)).toBe('a');

        // template is after another text node
        compile('<div>a<template tpl>b</template></div>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<div>a<template class="ng-binder"></template></div>');
        switchToTemplateDirective();
        verifyBinders('()');
        expect($html(container.childNodes)).toBe('b');

        // template has other directives on same node
        // (should be ignored)
        compile('<div><template tpl name="1">a</template></div>');
        verifyBinders('(),()');
        expect($html(container.childNodes)).toBe('<div><template class="ng-binder"></template></div>');
        switchToTemplateDirective();
        verifyBinders('()');
        expect($html(container.childNodes)).toBe('a');

        // template contains other directives on child elements
        compile('<template tpl=""><span name="1">a</span></template>');
        verifyBinders('(),()');
        switchToTemplateDirective();
        verifyBinders('(),1()');
        expect($html(container.childNodes)).toBe('<span name="1" class="ng-binder">a</span>');
      });

      it('should use the nodeAttrs of the template element', ()=>{
        createSelector([
          new TemplateDirective({selector: '[tpl]'})
        ]);
        compile('<template tpl="a" bind-b="c"></tempate>');
        var templateBinder = binders[1];
        expect(templateBinder.attrs.init).toEqual({
          tpl: 'a'
        });
        expect(templateBinder.attrs.bind).toEqual({
          b: 'c'
        });
      });

    });


  });

  function createSelector(directiveAnnotations = []) {
    directives = [];
    attrDirectiveAnnotations = {};
    directiveAnnotations.forEach(function(annotation) {
      var attr = extractAttrSelector(annotation);
      attrDirectiveAnnotations[attr] = annotation;
      clazz.annotations = [annotation];
      directives.push(clazz);

      function clazz() {}
    });

    function extractAttrSelector(directiveAnnotation) {
      if (!directiveAnnotation) {
        return null;
      }
      var match = /\[(\w+)\]/.exec(directiveAnnotation.selector);
      if (!match) {
        throw new Error('test selector only supports attribute names as selector!');
      }
      return match[1];
    }
  }

  function compile(html) {
    inject(Compiler, (compiler)=>{
      container = $('<div>'+html+'</div>')[0];
      binders = compiler.compileChildNodes(container, directives).binders;
    });
  }

  function stringifyBinders() {
    var structureAsString = [];
    var elements = findBinderElements();

    binders.forEach(function(elementBinder, binderIndex) {
      // Note: It's important to select the element
      // only by the index in the binders array
      var element;
      if (binderIndex > 0) {
        element = elements[binderIndex-1];
      } else {
        element = container;
      }

      var textBindersAsString = [];
      elementBinder.textBinders.forEach(function(textBinder, textIndex) {
        // Note: It's important to select the text node
        // only by the index in the binders array and the indexInParent,
        // as this is what the ViewFactory
        // also does.
        var node = element.childNodes[textBinder.indexInParent];
        textBindersAsString.push(node.nodeValue);
      });
      var annotationValues = '';
      for (var attrName in attrDirectiveAnnotations) {
        if (element && element.getAttribute) {
          var attrValue = element.getAttribute(attrName);
          if (attrValue) {
            annotationValues+=attrValue;
          }
        }
      }
      structureAsString.push(annotationValues + '(' + textBindersAsString.join(',') + ')');
    });
    return structureAsString.join(',');
  }

  function stringifyBinderLevels() {
    var structureAsString = [];
    var elements = findBinderElements();

    binders.forEach(function(elementBinder, binderIndex) {
      elementBinder = binders[binderIndex];
      structureAsString.push(elementBinder.level);
    });
    return structureAsString.join(',');
  }

  function compileAndVerifyBinders(html, expectedStructureAsString) {
    compile(html);
    verifyBinders(expectedStructureAsString);
  }

  function verifyBinders(expectedStructureAsString) {
    var elements = findBinderElements();
    expect(binders.length).toBe(elements.length+1);
    expect(stringifyBinders()).toBe(expectedStructureAsString);
  }

  function findBinderElements() {
    return container.querySelectorAll('.ng-binder');
  }

  function switchToTemplateDirective() {
    var compiledTemplate;
    binders.forEach(function(binder) {
      if (binder.template) {
        compiledTemplate = binder.template.compiledTemplate;
      }
    });
    expect(compiledTemplate).toBeTruthy();
    // update the global variables
    container = compiledTemplate.container;
    binders = compiledTemplate.binders;
  }
});
