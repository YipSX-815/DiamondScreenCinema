document.addEventListener('DOMContentLoaded', function () {
    const codeInputs = document.querySelectorAll('.code-input');
    const verifyButton = document.getElementById('verifyButton');
    const verificationForm = document.getElementById('verificationForm');

    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const value = e.target.value;

            if (!/^\d*$/.test(value)) {
                e.target.value = '';
                return;
            }

            if (value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }

            updateCodeInputs();
            checkCodeCompletion();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                codeInputs[index - 1].focus();
            }

            if (e.key === 'ArrowLeft' && index > 0) {
                codeInputs[index - 1].focus();
            }

            if (e.key === 'ArrowRight' && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData('text').trim();

            if (/^\d{6}$/.test(pasteData)) {
                const digits = pasteData.split('');
                digits.forEach((digit, i) => {
                    if (codeInputs[i]) {
                        codeInputs[i].value = digit;
                    }
                });
                updateCodeInputs();
                checkCodeCompletion();
                codeInputs[5].focus();
            }
        });
    });

    function updateCodeInputs() {
        codeInputs.forEach(input => {
            if (input.value) {
                input.classList.add('filled');
            } else {
                input.classList.remove('filled');
            }
        });
    }

    function checkCodeCompletion() {
        const code = Array.from(codeInputs).map(input => input.value).join('');
        verifyButton.disabled = code.length !== 6;
    }

    verificationForm.addEventListener('submit', function () {
        verifyButton.disabled = true;
        verifyButton.textContent = 'Verifying...';
    });

    function showError() {
        errorMessage.style.display = 'block';
        codeInputs.forEach(input => {
            input.value = '';
            input.classList.remove('filled');
        });
        codeInputs[0].focus();
        verifyButton.disabled = true;

        codeInputs.forEach(input => {
            input.style.animation = 'shake 0.5s';
            setTimeout(() => {
                input.style.animation = '';
            }, 500);
        });
    }

    codeInputs[0].focus();

    const style = document.createElement('style');
    style.textContent = `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
            `;
    document.head.appendChild(style);
});