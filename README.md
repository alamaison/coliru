coliru.js
======

JavaScript library for Coliru online compiler

Add ```<script>window.onload = coliru.addRunButtons</script>``` to
your page to insert buttons into every C++ code block that will
compile and run the code and displays the result below the code block.

C++ code blocks are those `<code>` elements with the `data-lang="c++"`
attribute.  For example:
```
<pre>
    <code data-lang="c++">
        int main()
        {
            return 0;
        }
    </code>
</pre>
```
