/*
    Tests for Coliru compiler web service JavaScript library.

    @licstart  The following is the entire license notice for the
    Javascript code in this page.

    Copyright (C) 2014 Alexander Lamaison

    The Javascript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

    As additional permission under GNU GPL version 3 section 7, you
    may distribute non-source (e.g., minimized or compacted) forms of
    that code without the copy of the GNU GPL normally required by
    section 4, provided you include this license notice and a URL
    through which recipients can access the Corresponding Source.

    @licend  The above is the entire license notice
    for the Javascript code in this page.
*/

'using strict';

function expectFindMain(sourceCode) {
    ok(coliru.containsMainMethod(sourceCode),
       'Has a main() method: ' + sourceCode);
}

function expectNotFindMain(sourceCode) {
    ok(!coliru.containsMainMethod(sourceCode),
       'Does not have a main() method: ' + sourceCode);
}


module("containsMainMethod");

test("no-arg main", function() {
    expectFindMain('int main() { return 0; }');
});

test("not main", function() {
    expectNotFindMain('int maim() { return 0; }');
});

test("arg main", function() {
    expectFindMain('int main(int argc, char* argv[]) { return 0; }');
});

test("no-arg main multiline", function() {
    expectFindMain('int main() \n{\n    return 0; }');
});

test("arg main multiline", function() {
    expectFindMain('int\nmain(int\n\t  argc, \n\tchar *argv[]) { return 0; }');
});


module("compile");

// 2 expected assertions when using this callback + however many are in given
// test
function responseCallback(expectedFinalResponseTest) {

    var hasRun = false;

    return function(response, state) {

        if (state == 'running') {
            // We don't know how many times 'running' is sent so
            // do assertion just once
            if (!hasRun) {
                equal(response, '');
            }
            hasRun = true;
        }
        else {
            equal(state, 'finished');
            expectedFinalResponseTest(response);
            start();
        }
    };
}

asyncTest("no output return success", function() {
    expect(3);

    coliru.compile('int main() { return 0; }',
                   responseCallback(function(response) { equal(response, ''); }));
});

asyncTest("no output return failure", function() {
    expect(3);

    coliru.compile('int main() { return 1; }',
                   responseCallback(function(response) { equal(response, ''); }));
});

asyncTest("run with output", function() {
    expect(3);

    coliru.compile(
        [
            '#include <iostream>',
            'int main() {',
            '    std::cout << "test string";',
            '    return 0;',
            '}'
        ].join('\n'),
        responseCallback(function(response) {
            equal(response, 'test string');
        }));

});

asyncTest("compile error", function() {
    expect(3);

    coliru.compile('int main() { burp; }',
                   responseCallback(function(response) {
                       ok(response.match(/error\:/));
                   }));
});

asyncTest("run crash", function() {
    expect(3);

    coliru.compile('int main() { throw 0; }',
                   responseCallback(function(response) {
                       ok(response.match(/terminate/));
                   }));
});

module("makeSourceRunnable");

test("make runnable", function() {

    // Adds one
    expectFindMain(coliru.makeSourceRunnable('int i = 12;'));

    // Leaves existing one unmolested
    expectFindMain(coliru.makeSourceRunnable('int main() { return 0; }'));

});

// Returns where the block we append to the code block is expected to appear.
// Using a function so it's easy to change the behaviour;
function findAppendedBlock(codeBlock) {
    return codeBlock.nextSibling;
}

function checkIsCompileArea(element) {

    equal(element.tagName, 'DIV');
}

function checkCompileAreaContainsRunButton(compileArea) {
    equal(compileArea.children.length, 1);
    equal(compileArea.firstChild.tagName, 'SPAN');
    ok(compileArea.firstChild.className.match(/runbutton/));
}

module("createCompileArea", {
    setup: function() {
        var fixture = document.getElementById('qunit-fixture');
        this.codeBlock = document.createElement('code');
        fixture.appendChild(this.codeBlock);
    }
});

// Both C++-tagged and non-C++-tagged blocks recieve a button from addRunButton

test("c++-code", function() {
    this.codeBlock.textContent = ''; // No dependent on content
    this.codeBlock.setAttribute('data-lang', 'c++');
    coliru.createCompileArea(this.codeBlock);

    var appendedBlock = findAppendedBlock(this.codeBlock);
    checkIsCompileArea(appendedBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});


test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++
    this.codeBlock.textContent = 'int main() { return 0; }';
    coliru.createCompileArea(this.codeBlock);

    var appendedBlock = findAppendedBlock(this.codeBlock);
    checkIsCompileArea(appendedBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});

module("updateCodeBlock", {
    setup: function() {
        var fixture = document.getElementById('qunit-fixture');
        this.codeBlock = document.createElement('code');
        fixture.appendChild(this.codeBlock);
    }
});

test("c++-code", function() {
    this.codeBlock.textContent = ''; // No dependent on content
    this.codeBlock.setAttribute('data-lang', 'c++');
    coliru.updateCodeBlock(this.codeBlock);

    var appendedBlock = findAppendedBlock(this.codeBlock);
    checkIsCompileArea(appendedBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});

test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++, so no button for you
    this.codeBlock.textContent = 'int main() { return 0; }';
    coliru.updateCodeBlock(this.codeBlock);
    ok(findAppendedBlock(this.codeBlock) == null);
});

module("addRunButtonsToCodeBlocks", {
    setup: function() {
        var fixture = document.getElementById('qunit-fixture');
        this.codeBlock = document.createElement('code');
        fixture.appendChild(this.codeBlock);
    }
});

test("c++-code", function() {
    this.codeBlock.textContent = ''; // No dependent on content
    this.codeBlock.setAttribute('data-lang', 'c++');

    // XXX: atomicity relies on #qunit-fixture containing the only code block
    // in the page - not great
    coliru.addRunButtonsToCodeBlocks();

    var appendedBlock = findAppendedBlock(this.codeBlock);
    checkIsCompileArea(appendedBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});

test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++, so no button for you
    this.codeBlock.textContent = 'int main() { return 0; }';

    // XXX: atomicity relies on #qunit-fixture containing the only code block
    // in the page - not great
    coliru.addRunButtonsToCodeBlocks();

    ok(findAppendedBlock(this.codeBlock) == null);
});
