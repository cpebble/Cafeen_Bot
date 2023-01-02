let socket = io();
let quoteContainer = document.getElementById("quote-container");

socket.on("quotes", quotes => {
    console.log(quotes);
    for (let i = 0; i < quotes.length; i++) {
        // Create quote elements
        let quote = quotes[i];
        // Author
        let quoteAuth = document.createElement("span");
        quoteAuth.classList.add("quote-author");
        quoteAuth.textContent = quote[0];
        quoteAuth.dataset.quoteid = i;
        quoteAuth.addEventListener("dblclick", handleDblClick);
        // Main Text
        let quoteText = document.createElement("span");
        quoteText.classList.add("quote-text");
        quoteText.textContent = quote[1];
        quoteText.dataset.quoteid = i;
        quoteText.addEventListener("dblclick", handleDblClick);
        // Append the children
        quoteContainer.appendChild(quoteAuth);
        quoteContainer.appendChild(quoteText);
    }

});

// Handle making content editable
function handleDblClick(ev) {
    // Release other editing elements
    let els = document.getElementsByClassName("editing");
    for(let i = 0; i < els.length; i++)
        cancel(els[i]);

    // Find target
    target = ev.target;
    // Tell the dom we're editing this quote
    target.contentEditable = 'true';
    target.classList.add("editing");
    target.addEventListener("keydown", handleKeyPress);
    target.dataset.ogtxt = utf8_to_b64(target.textContent);
}
function handleKeyPress(ev) {
    //console.log(ev);
    // Handle saving
    if (ev.key === "Enter") {
        ev.preventDefault();
        // Should Save
        save(ev.target);

    } else if (ev.key === "Escape") {
        ev.preventDefault();
        // Should Cancel
        cancel(ev.target);
    }
}
function save(target) {
    target.contentEditable = 'false';
    target.removeEventListener("keydown", handleKeyPress);
    target.classList.remove("editing");
    let evName;
    if(target.classList.contains("quote-author"))
        evName = "quote_change_author";
    else
        evName = "quote_change_text";
    let targetId = target.dataset.quoteid;
    socket.emit(evName, {"index": targetId, "newText": target.textContent});
}
function cancel(target) {
    let txtContent = b64_to_utf8(target.dataset.ogtxt);
    target.contentEditable = 'false';
    target.textContent = txtContent;
    target.removeEventListener("keydown", handleKeyPress);
    target.classList.remove("editing");

}


socket.on("connect", () => { socket.emit("fetch_quotes"); });

// Stolen from https://developer.mozilla.org/en-US/docs/Glossary/Base64#solution_1_%E2%80%93_escaping_the_string_before_encoding_it
function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}
