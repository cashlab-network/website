(function(){var b=document.getElementById("nav-toggle"),n=document.getElementById("site-nav")||document.getElementById("primary-nav");
if(!b||!n)return;
function setOpen(o){n.classList.toggle("nav--open",o);b.setAttribute("aria-expanded",o?"true":"false");b.setAttribute("aria-label",o?"Close menu":"Open menu");document.body.style.overflow=o?"hidden":"";}
b.addEventListener("click",function(e){e.stopPropagation();setOpen(!n.classList.contains("nav--open"));});
n.addEventListener("click",function(e){if(e.target.tagName==="A")setOpen(false);});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&n.classList.contains("nav--open"))setOpen(false);});
document.addEventListener("click",function(e){if(n.classList.contains("nav--open")&&!n.contains(e.target)&&e.target!==b&&!b.contains(e.target))setOpen(false);});
})();
