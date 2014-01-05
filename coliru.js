/*
    Coliru compiler web service JavaScript library.

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

'use strict';

var coliru = (function() {

    function displayColiruOutput(codeBlock) {

        var separator = document.createElement('hr');
        codeBlock.parentNode.insertBefore(separator, codeBlock.nextSibling);

        var outputArea = document.createElement('div');
        codeBlock.parentNode.insertBefore(outputArea, separator.nextSibling);

        var sourceCode = codeBlock.textContent;

        coliru.compile(coliru.makeSourceRunnable(sourceCode),
                       function(response) {
                           outputArea.textContent = response;
                       });
    }

    function createCompileButton(codeBlock, compileAction) {

        var compileButton = document.createElement('input');
        compileButton.type = 'button';
        compileButton.value = 'Run this code';
        compileButton.style = 'float : right';
        compileButton.onclick = compileAction;

        codeBlock.parentNode.insertBefore(compileButton, codeBlock);
    }

    return {

        compile: function(sourceCode, compileReadyResponse) {

            var compileCommand = [
                'g++-4.8 -std=c++11 -O2 -Wall -pedantic -pthread main.cpp ',
                '&& ./a.out'].join('');

            var coliruConnection = new XMLHttpRequest();
            coliruConnection.open("POST",
                                  "http://coliru.stacked-crooked.com/compile",
                                  true);

            coliruConnection.onreadystatechange = function() {
                if (coliruConnection.readyState == 4 &&
                    coliruConnection.status == 200) {
                    compileReadyResponse(coliruConnection.response);
                }
            }

            coliruConnection.send(
                JSON.stringify({ "cmd": compileCommand, "src": sourceCode }));
        },

        makeSourceRunnable: function(sourceCode) {
            if (coliru.containsMainMethod(sourceCode)) {
                return sourceCode;
            }
            else {
                return 'int main() {\n' + sourceCode + '\nreturn 0;\n}';
            }
        },

        containsMainMethod: function(sourceCode) {
            return sourceCode.match(/int\s+main\([^\)]*\)\s*[\{;]/);
        },

        addRunButton: function(codeBlock) {

            createCompileButton(codeBlock,
                                function(codeBlock) {
                                    return function() {
                                        displayColiruOutput(codeBlock);
                                    }
                                }(codeBlock));
        },

        updateCodeBlock: function(codeBlock) {

            if (codeBlock.getAttribute('data-lang') == 'c++') {
                coliru.addRunButton(codeBlock);
            }
        },

        addRunButtonsToCodeBlocks: function() {

            var els = document.getElementsByTagName('code');

            for (var i = 0; i < els.length; ++i) {
               coliru.updateCodeBlock(els[i]);
            }

        },
    }

})()
