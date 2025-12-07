document.addEventListener("DOMContentLoaded", () => {
    const dropdowns = document.querySelectorAll(".custom-dropdown");

    dropdowns.forEach(drop => {
        const selected = drop.querySelector(".dropdown-selected");
        const options = drop.querySelector(".dropdown-options");
        const inputName = drop.dataset.target;
        const hiddenInput = document.querySelector(`input[name='${inputName}']`);

        drop.addEventListener("click", () => {
            drop.classList.toggle("active");
        });

        drop.querySelectorAll(".dropdown-option").forEach(opt => {
            opt.addEventListener("click", (e) => {
                e.stopPropagation();
                selected.textContent = opt.textContent;
                hiddenInput.value = opt.dataset.value;

                drop.classList.remove("active");
            });
        });
    });

    document.addEventListener("click", (e) => {
        document.querySelectorAll(".custom-dropdown.active").forEach(d => {
            if (!d.contains(e.target)) d.classList.remove("active");
        });
    });
});
