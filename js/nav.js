
(function(){var b=document.getElementById("nav-toggle"),n=document.getElementById("site-nav");
if(!b||!n)return;
b.addEventListener("click",function(){var o=n.classList.toggle("nav--open");
b.setAttribute("aria-expanded",o?"true":"false");
b.setAttribute("aria-label",o?"Close menu":"Open menu");});
n.addEventListener("click",function(e){if(e.target.tagName==="A"&&n.classList.contains("nav--open")){n.classList.remove("nav--open");b.setAttribute("aria-expanded","false");}});
})();
