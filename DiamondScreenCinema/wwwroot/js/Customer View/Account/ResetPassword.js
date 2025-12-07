document.addEventListener("DOMContentLoaded", () => {
    const passwordInput = $("#Password");

    if (passwordInput.length) {
        passwordInput.on("input", function () {
            const value = $(this).val();

            validateRule("#rule-length", value.length >= 8);
            validateRule("#rule-uppercase", /[A-Z]/.test(value));
            validateRule("#rule-lowercase", /[a-z]/.test(value));
            validateRule("#rule-number", /\d/.test(value));
            validateRule("#rule-special", /[!@#$%^&*]/.test(value));
        });
    }
});

function validateRule(selector, condition) {
    const el = $(selector);
    el.removeClass("valid invalid");

    if (condition) {
        el.addClass("valid");
    } else if (el.text().trim() !== "") {
        el.addClass("invalid");
    }
}