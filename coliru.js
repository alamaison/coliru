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

    function displayColiruOutput(codeBlock, compileArea) {

        // Remove button so the compile-display process can
        // only happen once
        compileArea.removeChild(compileArea.firstChild);

        var sourceCode = codeBlock.textContent;

        coliru.compile(coliru.makeSourceRunnable(sourceCode),
                       function(response, state) {

                           var displayText = '';
                           if (state == 'connecting') {
                               displayText = 'Connecting...\n';
                           }
                           else if (state == 'running') {
                               displayText = 'Running...\n';
                           }
                           else if (state == 'error') {
                               displayText = 'Error:\n';
                           }

                           displayText += response

                           compileArea.textContent = displayText;
                           // Formatting for coliru before it has run the code
                           compileArea.setAttribute('data-coliru-state', 'finished');
                       });
    }

    function createCompileButton(compileArea, compileAction) {

        var compileButton = document.createElement('input');
        compileButton.type = 'button';
        compileButton.value = 'Run this code';
        compileButton.onclick = compileAction;

        compileArea.appendChild(compileButton);
    }

    return {

        compile: function(sourceCode, compileReadyResponse) {

            var compileCommand = [
                'g++-4.8 -std=c++11 -O2 -Wall -pedantic -pthread main.cpp ',
                '&& ./a.out'].join('');

            var coliruConnection = new XMLHttpRequest();

            coliruConnection.onreadystatechange = function() {
                if (coliruConnection.readyState == 4) {
                    if (coliruConnection.status != 200) {
                        compileReadyResponse(coliruConnection.response, 'error');
                    }
                    else {
                        compileReadyResponse(coliruConnection.response, 'finished');
                    }
                }
                else {
                    compileReadyResponse(coliruConnection.response, 'running');
                }
            }

            coliruConnection.open("POST",
                                  "http://coliru.stacked-crooked.com/compile",
                                  true);

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

        createCompileArea: function(codeBlock) {
            var compileArea = document.createElement('div');

            // Pygments output formatting
            compileArea.className += ' go';
            // Allow coliru-specific formatting
            compileArea.className += ' coliru';
            // Formatting for coliru before it has run the code
            compileArea.setAttribute('data-coliru-state', 'not-run');

            createCompileButton(compileArea,
                                function(codeBlock, compileArea) {
                                    return function() {
                                        displayColiruOutput(codeBlock,
                                                            compileArea);
                                    }
                                }(codeBlock, compileArea));

            codeBlock.parentNode.insertBefore(compileArea, codeBlock.nextSibling);
        },

        updateCodeBlock: function(codeBlock) {

            if (codeBlock.getAttribute('data-lang') == 'c++') {
                coliru.createCompileArea(codeBlock);
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
