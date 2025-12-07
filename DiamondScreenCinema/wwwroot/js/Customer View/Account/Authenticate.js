document.addEventListener("DOMContentLoaded", () => {
    const loginPanel = document.getElementById("loginPanel");
    const registerPanel = document.getElementById("registerPanel");

    const loginImage = document.getElementById("loginImage");
    const registerImage = document.getElementById("registerImage");

    const emailGroup = document.getElementById("emailGroup");
    const phoneRow = document.getElementById("phoneLoginRow");

    const phoneLoginBtn = document.getElementById("phoneLoginBtn");
    const emailLoginBtn = document.getElementById("emailLoginBtn");

    const registerEmailGroup = document.getElementById("registerEmailGroup");
    const registerPhoneRow = document.getElementById("registerPhoneRow");

    const registerPhoneBtn = document.getElementById("registerPhoneBtn");
    const registerEmailBtn = document.getElementById("registerEmailBtn");

    function clearLoginFields() {
        document.querySelector('[name="LoginVM.Email"]').value = "";
        document.querySelector('[name="LoginVM.Phone"]').value = "";
    }

    function clearRegisterFields() {
        document.querySelector('[name="RegisterVM.Email"]').value = "";
        document.querySelector('[name="RegisterVM.Phone"]').value = "";
    }

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

    registerPhoneBtn.addEventListener("click", () => {
        clearRegisterFields();
        registerEmailGroup.style.display = "none";
        registerPhoneRow.style.display = "flex";
        registerPhoneBtn.style.display = "none";
        registerEmailBtn.style.display = "inline";
    });

    registerEmailBtn.addEventListener("click", () => {
        clearRegisterFields();
        registerPhoneRow.style.display = "none";
        registerEmailGroup.style.display = "flex";
        registerEmailBtn.style.display = "none";
        registerPhoneBtn.style.display = "inline";
    });

    flatpickr("#dobInput", {
        altInput: true,
        altFormat: "d-m-Y",
        dateFormat: "Y-m-d",
        maxDate: new Date().fp_incr(-4380),
        minDate: new Date().fp_incr(-47450),
        theme: "dark",
        static: true
    });

    if (openRegister === true) {
        showRegister();
    } else {
        showLogin();
    }

    const passwordInput = $("#RegisterVM_Password");

    passwordInput.on("input", function () {
        const value = $(this).val();

        validateRule("#rule-length", value.length >= 8);
        validateRule("#rule-uppercase", /[A-Z]/.test(value));
        validateRule("#rule-lowercase", /[a-z]/.test(value));
        validateRule("#rule-number", /\d/.test(value));
        validateRule("#rule-special", /[!@#$%^&*]/.test(value));
    });

});

function validateRule(selector, condition) {
    const el = $(selector);

    el.removeClass("valid invalid");

    if (!condition && el.text().trim() !== "")
        el.addClass("invalid");
    if (condition)
        el.addClass("valid");
}

function showRegister() {
    loginPanel.classList.add("hidden");
    loginImage.classList.add("hidden");

    registerPanel.classList.remove("hidden");
    registerImage.classList.remove("hidden");

    pageTitle.innerText = "Register | Diamond Screen Cinema";
}

function showLogin() {
    registerPanel.classList.add("hidden");
    registerImage.classList.add("hidden");

    loginPanel.classList.remove("hidden");
    loginImage.classList.remove("hidden");

    pageTitle.innerText = "Login | Diamond Screen Cinema";
}