const header = document.querySelector("header");
const backToTop = document.getElementById("backToTop");
const trigger = document.getElementById("stopTrigger");

window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
        header.classList.add("scrolled");
        backToTop.classList.add("visible");
    } else {
        header.classList.remove("scrolled");
        backToTop.classList.remove("visible");
    }
});

backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            backToTop.classList.add("stop");
        } else {
            backToTop.classList.remove("stop");
        }
    });
});

observer.observe(trigger);