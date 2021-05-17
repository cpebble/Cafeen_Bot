

// This supports changing memory views
function changeTab(ev){
    let tabs = document.querySelectorAll(".tab")
    let tab = `${ev.target.dataset.tab}_tab`;
    for(let i = 0; i < tabs.length; i++){
        let el = tabs[i];
        if (el.id != tab){
            el.classList.add("inactive");
        }
        else{el.classList.remove("inactive")}
    }

    ev.target.classList.remove("inactive")
}