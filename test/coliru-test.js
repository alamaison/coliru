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
function responseCallback(expectedFinalStateTest) {

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
            expectedFinalStateTest(state, response);
            start();
        }
    };
}

asyncTest("no output return success", function() {
    expect(3);

    coliru.compile('int main() { return 0; }',
                   responseCallback(function(state, response) {
                       strictEqual(state, 0);
                       equal(response, '');
                   }));
});

asyncTest("no output return failure", function() {
    expect(3);

    coliru.compile('int main() { return 1; }',
                   responseCallback(function(state, response) {
                       strictEqual(state, 1);
                       equal(response, '');
                   }));
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
        responseCallback(function(state, response) {
            strictEqual(state, 0);
            equal(response, 'test string');
        }));

});

asyncTest("compile error", function() {
    expect(3);

    coliru.compile('int main() { burp; }',
                   responseCallback(function(state, response) {
                       notStrictEqual(state, 0);
                       ok(response.match(/error\:/));
                   }));
});

asyncTest("run crash", function() {
    expect(3);

    coliru.compile('int main() { throw 0; }',
                   responseCallback(function(state, response) {
                       notStrictEqual(state, 0);
                       ok(response.match(/terminate/));
                   }));
});

// no-main code magically includes common std headers
asyncTest("compile with extra link libraries", function() {
    expect(3);

    // If either library is missing this will fail to link
    coliru.linkLibraries = ['boost_system', 'boost_filesystem'];
    var source =
        [
            '#include <iostream>',
            '#include <boost/filesystem.hpp>',
            'int main() {',
            '    std::cout << boost::filesystem::temp_directory_path();',
            '}'
        ].join('\n');

    coliru.compile(source,
                   responseCallback(function(state, response) {
                       strictEqual(state, 0);
                       ok(response, /\/.+/);
                   }));
});

module("makeSourceRunnable");

test("make runnable", function() {

    // Adds one
    expectFindMain(coliru.makeSourceRunnable('int i = 12;'));

    // Leaves existing one unmolested
    expectFindMain(coliru.makeSourceRunnable('int main() { return 0; }'));

});

asyncTest("no explicit main", function() {
    expect(3);

    var source = coliru.makeSourceRunnable('int i = 0; i++;');

    coliru.compile(source,
                   responseCallback(function(state, response) {
                       strictEqual(state, 0);
                       equal(response, '');
                   }));
});

// no-main code magically includes common std headers
asyncTest("compile no explicit main with output", function() {
    expect(3);

    coliru.magicIncludes = ['iostream'];
    var source = coliru.makeSourceRunnable(
        'std::cout << "this magically works";');

    coliru.compile(source,
                   responseCallback(function(state, response) {
                       strictEqual(state, 0);
                       equal(response, 'this magically works');
                   }));
});

// no-main code magically includes common std headers
asyncTest("compile no explicit main with auto_ptr", function() {
    expect(3);

    coliru.magicIncludes = ['memory'];

    var source = coliru.makeSourceRunnable(
        'std::auto_ptr<int> bob; bob.reset();');
    coliru.compile(source,
                   responseCallback(function(state, response) {
                       strictEqual(state, 0);
                       equal(response, '');
                   }));
});

function checkCompileAreaContainsRunButton(compileArea) {
    equal(compileArea.children.length, 1);
    equal(compileArea.firstChild.tagName, 'SPAN');
    ok(compileArea.firstChild.className.match(/runbutton/));
}

function checkBlockAdded(codeBlock) {

    var pre = codeBlock.parentNode;

    // If this fails, the fixture was set up incorrectly
    equal(pre.tagName, 'PRE');

    var coliruBlock = pre.nextSibling;
    equal(coliruBlock.tagName, 'DIV');
    ok(coliruBlock.className.match(/\bcoliru\b/));

    return coliruBlock;
}

// Hard to be sure a block wasn't added but we look in the likely places
function checkBlockNotAdded(codeBlock) {

    var pre = codeBlock.parentNode;

    if (pre.tagName == 'PRE') {
        ok(pre.nextSibling == null);
    }
    else {
        ok(codeBlock.nextSibling == null);
    }
}

function createFixtureCodeBlock() {
    var fixture = document.getElementById('qunit-fixture');

    preBlock = document.createElement('pre');
    fixture.appendChild(preBlock);

    codeBlock = document.createElement('code');
    preBlock.appendChild(this.codeBlock);

    return codeBlock;
}

module("createCompileArea", {
    setup: function() {
        this.codeBlock = createFixtureCodeBlock();
    }
});

// Both C++-tagged and non-C++-tagged blocks recieve a button from addRunButton

test("c++-code", function() {
    this.codeBlock.textContent = ''; // No dependent on content
    this.codeBlock.setAttribute('data-lang', 'c++');

    coliru.createCompileArea(this.codeBlock);

    var appendedBlock = checkBlockAdded(this.codeBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});


test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++
    this.codeBlock.textContent = 'int main() { return 0; }';
    coliru.createCompileArea(this.codeBlock);

    var appendedBlock = checkBlockAdded(this.codeBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});

module("updateCodeBlock", {
    setup: function() {
        this.codeBlock = createFixtureCodeBlock();
    }
});

test("c++-code", function() {
    this.codeBlock.textContent = ''; // No dependent on content
    this.codeBlock.setAttribute('data-lang', 'c++');
    coliru.updateCodeBlock(this.codeBlock);

    var appendedBlock = checkBlockAdded(this.codeBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});

test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++, so no button for you
    this.codeBlock.textContent = 'int main() { return 0; }';
    coliru.updateCodeBlock(this.codeBlock);

    checkBlockNotAdded(this.codeBlock);
});

module("updateCodeBlock (non-pre code block)", {
    setup: function() {
        var fixture = document.getElementById('qunit-fixture');

        this.codeBlock = document.createElement('code');
        fixture.appendChild(this.codeBlock);
    }
});

test("c++-code", function() {
    // Even though it's tagged as a c++ code block, it's not in a
    // <pre> block so not sensible to add run button

    this.codeBlock.textContent = ''; // No dependent on content
    this.codeBlock.setAttribute('data-lang', 'c++');

    coliru.updateCodeBlock(this.codeBlock);

    checkBlockNotAdded(this.codeBlock);
});

test("non-c++-tagged-code", function() {
    // Not in a pre block and not tagged as c++, so no button for you
    this.codeBlock.textContent = 'int main() { return 0; }';
    coliru.updateCodeBlock(this.codeBlock);

    checkBlockNotAdded(this.codeBlock);
});

module("addRunButtonsToCodeBlocks", {
    setup: function() {
        this.codeBlock = createFixtureCodeBlock();
    }
});

test("c++-code", function() {
    this.codeBlock.textContent = ''; // No dependent on content
    this.codeBlock.setAttribute('data-lang', 'c++');

    // XXX: atomicity relies on #qunit-fixture containing the only code block
    // in the page - not great
    coliru.addRunButtonsToCodeBlocks();

    var appendedBlock = checkBlockAdded(this.codeBlock);
    checkCompileAreaContainsRunButton(appendedBlock);
});

test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++, so no button for you
    this.codeBlock.textContent = 'int main() { return 0; }';

    // XXX: atomicity relies on #qunit-fixture containing the only code block
    // in the page - not great
    coliru.addRunButtonsToCodeBlocks();

    checkBlockNotAdded(this.codeBlock);
});
