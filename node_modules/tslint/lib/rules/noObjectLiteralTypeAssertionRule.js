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
var ts = require("typescript");
var Lint = require("../index");
var Rule = (function (_super) {
    tslib_1.__extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithFunction(sourceFile, walk);
    };
    return Rule;
}(Lint.Rules.AbstractRule));
/* tslint:disable:object-literal-sort-keys */
Rule.metadata = {
    ruleName: "no-object-literal-type-assertion",
    description: "Forbids an object literal to appear in a type assertion expression.",
    rationale: (_a = ["\n            Always prefer `const x: T = { ... };` to `const x = { ... } as T;`.\n            The type assertion in the latter case is either unnecessary or hides an error.\n            `const x: { foo: number } = {}` will fail, but `const x = {} as { foo: number }` succeeds."], _a.raw = ["\n            Always prefer \\`const x: T = { ... };\\` to \\`const x = { ... } as T;\\`.\n            The type assertion in the latter case is either unnecessary or hides an error.\n            \\`const x: { foo: number } = {}\\` will fail, but \\`const x = {} as { foo: number }\\` succeeds."], Lint.Utils.dedent(_a)),
    optionsDescription: "Not configurable.",
    options: null,
    optionExamples: [true],
    type: "functionality",
    typescriptOnly: true,
};
/* tslint:enable:object-literal-sort-keys */
Rule.FAILURE_STRING = "Type assertion applied to object literal.";
exports.Rule = Rule;
function walk(ctx) {
    return ts.forEachChild(ctx.sourceFile, function cb(node) {
        if (isTypeAssertionLike(node) && isObjectLiteral(node.expression)) {
            ctx.addFailureAtNode(node, Rule.FAILURE_STRING);
        }
        return ts.forEachChild(node, cb);
    });
}
function isTypeAssertionLike(node) {
    switch (node.kind) {
        case ts.SyntaxKind.TypeAssertionExpression:
        case ts.SyntaxKind.AsExpression:
            return true;
        default:
            return false;
    }
}
function isObjectLiteral(node) {
    switch (node.kind) {
        case ts.SyntaxKind.ParenthesizedExpression:
            return isObjectLiteral(node.expression);
        case ts.SyntaxKind.ObjectLiteralExpression:
            return true;
        default:
            return false;
    }
}
var _a;
