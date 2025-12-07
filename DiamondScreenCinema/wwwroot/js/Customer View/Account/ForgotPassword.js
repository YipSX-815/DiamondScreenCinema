document.addEventListener("DOMContentLoaded", () => {
    const emailGroup = document.getElementById("emailGroup");
    const phoneRow = document.getElementById("phoneLoginRow");
    const phoneLoginBtn = document.getElementById("phoneLoginBtn");
    const emailLoginBtn = document.getElementById("emailLoginBtn");

    function clearLoginFields() {
        const emailInput = document.querySelector('[name="Email"]');
        const phoneInput = document.querySelector('[name="Phone"]');

        if (emailInput) emailInput.value = "";
        if (phoneInput) phoneInput.value = "";
    }

    if (phoneLoginBtn && emailLoginBtn && emailGroup && phoneRow) {
        phoneLoginBtn.addEventListener("click", () => {
            clearLoginFields();
            emailGroup.style.display = "none";
            phoneRow.style.display = "flex";
            phoneLoginBtn.style.display = "none";
            emailLoginBtn.style.display = "inline";
        });

        emailLoginBtn.addEventListener("click", () => {
            clearLoginFields();
            phoneRow.style.display = "none";
            emailGroup.style.display = "flex";
            emailLoginBtn.style.display = "none";
            phoneLoginBtn.style.display = "inline";
        });
    }
});
