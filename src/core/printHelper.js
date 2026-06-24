window.onload = () => window.print();<\/script>
</body>
</html>`;

            const w = window.open('', '_blank');
            w.document.write(html);
            w.document.close();
        }
    
