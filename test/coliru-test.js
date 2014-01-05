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

asyncTest("no output return success", function() {
    expect(1);

    coliru.compile('int main() { return 0; }',
                   function(response) { equal(response, ''); start(); });
});

asyncTest("no output return failure", function() {
    expect(1);

    coliru.compile('int main() { return 1; }',
                   function(response) { equal(response, ''); start(); });
});

asyncTest("run with output", function() {
    expect(1);

    coliru.compile([
        '#include <iostream>',
        'int main() {',
        '    std::cout << "test string";',
        '    return 0;',
        '}'
    ].join('\n'),
    function(response) { equal(response, 'test string'); start(); });

});

asyncTest("compile error", function() {
    expect(1);

    coliru.compile('int main() { burp; }',
                   function(response) {
                       ok(response.match(/error\:/)); start();
                   });

});

asyncTest("run crash", function() {
    expect(1);

    coliru.compile('int main() { throw 0; }',
                   function(response) {
                       ok(response.match(/terminate/)); start();
                   });

});

module("makeSourceRunnable");

test("make runnable", function() {

    // Adds one
    expectFindMain(coliru.makeSourceRunnable('int i = 12;'));

    // Leaves existing one unmolested
    expectFindMain(coliru.makeSourceRunnable('int main() { return 0; }'));

});

module("addRunButton", {
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
    coliru.addRunButton(this.codeBlock);
    equal(this.codeBlock.previousSibling.tagName, 'INPUT');
    equal(this.codeBlock.previousSibling.type, 'button');
});


test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++
    this.codeBlock.textContent = 'int main() { return 0; }';
    coliru.addRunButton(this.codeBlock);
    equal(this.codeBlock.previousSibling.tagName, 'INPUT');
    equal(this.codeBlock.previousSibling.type, 'button');
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
    equal(this.codeBlock.previousSibling.tagName, 'INPUT');
    equal(this.codeBlock.previousSibling.type, 'button');
});

test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++, so no button for you
    this.codeBlock.textContent = 'int main() { return 0; }';
    coliru.updateCodeBlock(this.codeBlock);
    ok(this.codeBlock.previousSibling == null);
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

    equal(this.codeBlock.previousSibling.tagName, 'INPUT');
    equal(this.codeBlock.previousSibling.type, 'button');
});

test("non-c++-tagged-code", function() {
    // despite appearances, not tagged as c++, so no button for you
    this.codeBlock.textContent = 'int main() { return 0; }';

    // XXX: atomicity relies on #qunit-fixture containing the only code block
    // in the page - not great
    coliru.addRunButtonsToCodeBlocks();

    ok(this.codeBlock.previousSibling == null);
});
