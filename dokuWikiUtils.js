
/**
 * Parses a dokuWiki page and creates a hashmap of tooltip entries composed of section headings and their first paragraph.
 * Internal wiki links are sanitized to work externally, and all links open in a new tab. 
 */
export function buildSectionTooltips(page) {
    var request = new XMLHttpRequest();
    request.open('GET', page + "&do=export_html", true);
    request.responseType = 'blob';
    request.onload = function() {
        var reader = new FileReader();
        reader.readAsText(request.response);
        reader.onload =  function(e){
            console.log('DataURL:', e.target.result);
            var ele = document.getElementById('htmlParserElem')
            ele.innerHTML = e.target.result;

            headers = Array.from(ele.querySelectorAll("h1, h2, h3, h4, h5, h6"));
            headers.forEach(function(header){
            if(!header.id) return;
            var html = "<a href=\""+ page +"#" + header.id +"\">" + header.innerHTML +"</a>"
            if(header.nextElementSibling && header.nextElementSibling.children[0] && header.nextElementSibling.children[0].nodeName == "P") {
                html += header.nextElementSibling.children[0].outerHTML;
            }
            section[header.id] = html;
            });
        };
    };
    request.send();
}

function parseHtml(e, page) {
    
}