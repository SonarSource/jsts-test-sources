"use strict";
/**
 * @license
 * Copyright 2017 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var utils = require("tsutils");
var ts = require("typescript");
var Lint = require("../index");
var OPTION_MIN_CASES = "min-cases";
var Rule = (function (_super) {
    tslib_1.__extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        var minCases = 2;
        if (this.ruleArguments.length) {
            var obj = this.ruleArguments[0];
            minCases = obj[OPTION_MIN_CASES];
        }
        return this.applyWithFunction(sourceFile, walk, minCases);
    };
    return Rule;
}(Lint.Rules.AbstractRule));
/* tslint:disable:object-literal-sort-keys */
Rule.metadata = {
    ruleName: "prefer-switch",
    description: "Prefer a `switch` statement to an `if` statement with simple `===` comparisons.",
    optionsDescription: (_a = ["\n            An optional object with the property '", "'.\n            This is the number cases needed before a switch statement is recommended.\n            Defaults to 2."], _a.raw = ["\n            An optional object with the property '", "'.\n            This is the number cases needed before a switch statement is recommended.\n            Defaults to 2."], Lint.Utils.dedent(_a, OPTION_MIN_CASES)),
    options: {
        type: "object",
        properties: (_b = {},
            _b[OPTION_MIN_CASES] = { type: "number" },
            _b),
    },
    optionExamples: ["true", "[\"true\", { \"" + OPTION_MIN_CASES + "\": 2 }]"],
    type: "style",
    typescriptOnly: false,
};
/* tslint:enable:object-literal-sort-keys */
Rule.FAILURE_STRING = "Use a switch statement instead of using multiple '===' checks.";
exports.Rule = Rule;
function walk(ctx) {
    var minCases = ctx.options, sourceFile = ctx.sourceFile;
    return ts.forEachChild(sourceFile, function cb(node) {
        if (utils.isIfStatement(node) && check(node, sourceFile, minCases)) {
            var expression = node.expression, thenStatement = node.thenStatement, elseStatement = node.elseStatement;
            ctx.addFailureAtNode(expression, Rule.FAILURE_STRING);
            // Be careful not to fail again for the "else if"
            ts.forEachChild(expression, cb);
            ts.forEachChild(thenStatement, cb);
            if (elseStatement) {
                ts.forEachChild(elseStatement, cb);
            }
        }
        else {
            return ts.forEachChild(node, cb);
        }
    });
}
function check(node, sourceFile, minCases) {
    var switchVariable;
    var casesSeen = 0;
    var couldBeSwitch = everyCase(node, function (expr) {
        casesSeen++;
        if (switchVariable) {
            return nodeEquals(expr, switchVariable, sourceFile);
        }
        else {
            switchVariable = expr;
            return true;
        }
    });
    return couldBeSwitch && casesSeen >= minCases;
}
function everyCase(_a, test) {
    var expression = _a.expression, elseStatement = _a.elseStatement;
    if (!everyCondition(expression, test)) {
        return false;
    }
    return !elseStatement || !utils.isIfStatement(elseStatement) || everyCase(elseStatement, test);
}
function everyCondition(node, test) {
    if (!utils.isBinaryExpression(node)) {
        return false;
    }
    var operatorToken = node.operatorToken, left = node.left, right = node.right;
    switch (operatorToken.kind) {
        case ts.SyntaxKind.BarBarToken:
            return everyCondition(left, test) && everyCondition(right, test);
        case ts.SyntaxKind.EqualsEqualsEqualsToken:
            return isSimple(left) && isSimple(right) && test(left);
        default:
            return false;
    }
}
function nodeEquals(a, b, sourceFile) {
    return a.getText(sourceFile) === b.getText(sourceFile);
}
function isSimple(node) {
    switch (node.kind) {
        case ts.SyntaxKind.PropertyAccessExpression:
            return isSimple(node.expression);
        case ts.SyntaxKind.Identifier:
        case ts.SyntaxKind.NumericLiteral:
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.ThisKeyword:
            return true;
        default:
            return false;
    }
}
var _a, _b;
