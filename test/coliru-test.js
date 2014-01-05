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

test("main() finder", function() {

    function expectFindMain(sourceCode) {
        ok(coliru.containsMainMethod(sourceCode),
           'Has a main() method: ' + sourceCode);
    }
    function expectNotFindMain(sourceCode) {
        ok(!coliru.containsMainMethod(sourceCode),
           'Does not have a main() method: ' + sourceCode);
    }

    expectFindMain('int main() { return 0; }');
    expectNotFindMain('int maim() { return 0; }');
    expectFindMain('int main(int argc, char* argv[]) { return 0; }');
    expectFindMain('int\nmain(int\n\t  argc, \n\tchar *argv[]) { return 0; }');
    expectFindMain('int main() \n{\n    return 0; }');

});

test("compile ok run ok", function() {

    equal(coliru.compile('int main() { return 0; }'), '');
    equal(coliru.compile('int main() { return 1; }'), '');

    equal(coliru.compile([
        '#include <iostream>',
        'int main() {',
        '    std::cout << "test string";',
        '    return 0;',
        '}'
    ].join('\n')), 'test string');

});

test("compile ok run fail", function() {

    ok(coliru.compile('int main() { throw 0; }').match(/terminate/));

});

test("compile error", function() {

    ok(coliru.compile('int main() { burp; }').match(/error\:/));

});

test("make runnable", function() {

    function expectFindMain(sourceCode) {
        ok(coliru.containsMainMethod(sourceCode),
           'Has a main() method: ' + sourceCode);
    }

    // Adds one
    expectFindMain(coliru.makeSourceRunnable('int i = 12;'));

    // Leaves existing one unmolested
    expectFindMain(coliru.makeSourceRunnable('int main() { return 0; }'));

});
