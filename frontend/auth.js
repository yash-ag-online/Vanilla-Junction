const authForm = document.querySelector("#auth-form");
const errorBadge = document.querySelector(".error");
const button = document.querySelector(".button");

function showError(msg) {
    errorBadge.style.display = "block";
    errorBadge.innerHTML = msg;
}

function handleFormSubmit() {
    authForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const formData = new FormData(authForm);
        const phone = formData.get("phone");

        if (!phone) return;

        if (phone.length !== 13) {
            showError("Invalid phone number!");
            return;
        }

        if (phone.slice(0, 3) !== "+91") {
            showError("Invalid phone number!");
            return;
        }

        const phoneRegex = /^\d+$/;
        if (!phoneRegex.test(phone.slice(3))) {
            showError("Invalid phone number!");
            return;
        }

        const phoneNumber = {
            countryCode: phone.slice(0, 3),
            number: phone.slice(3),
        };

        button.innerHTML = `<img
                  src="./icons/loader.svg"
                  class="icon loader"
                  alt="cart icon"
                >`;
        document.querySelector(".loader").style.animation =
            "spin 1s linear infinite";

        fetch(
            `http://127.0.0.1:3000/api/v1/customers/generate-login-otp`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", //
                },
                body: JSON.stringify({ phoneNumber }),
            },
        ).then((result) => {
            return result.json();
        }).then((response) => {
            if (response) {
                if (response.statusCode >= 400) {
                    showError(response.message);
                    button.innerHTML = `Send OTP`;
                    return;
                } else {
                    const otpForm = document.createElement("form");
                    otpForm.innerHTML = `
              <fieldset class="login-fieldset">
                  <div class="field">
                      <label for="otp">Enter OTP</label>
                      <input type="number" name="otp" id="otp" required>
                  </div>
                  <button class="button">Verify OTP</button>
              </fieldset>
              `;
                    authForm.replaceWith(otpForm);

                    otpForm.addEventListener("submit", async (e) => {
                        e.preventDefault();

                        document.querySelector(".button").innerHTML = `<img
                  src="./icons/loader.svg"
                  class="icon loader"
                  alt="cart icon"
                >`;
                        document.querySelector(".loader").style.animation =
                            "spin 1s linear infinite";

                        const otpFormData = new FormData(otpForm);
                        const otp = otpFormData.get("otp").toString();

                        if (!otp) return;

                        if (otp.length !== 6) {
                            showError("Invalid OTP!");
                            return;
                        }

                        fetch(
                            `http://127.0.0.1:3000/api/v1/customers/login`,
                            {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    phoneNumber,
                                    otp,
                                }),
                                credentials: "include",
                            },
                        ).then((response) => {
                            return response.json();
                        }).then((result) => {
                            if (result) {
                                if (result.statusCode >= 400) {
                                    showError(result.message);
                                    document.querySelector(".button").innerHTML = `Verify OTP`;
                                    return;
                                } else {
                                    window.location.replace("account.html");
                                }
                            } else {
                                showError("Something went wrong!");
                                document.querySelector(".button").innerHTML = `Verify OTP`;
                                return;
                            }
                        }).catch((e) => {
                            showError(e.message ? e.message : "Something went wrong!");
                            document.querySelector(".button").innerHTML = `Verify OTP`;
                            console.log(e);
                        });
                    });
                }
            } else {
                showError("Something went wrong!");
                button.innerHTML = `Send OTP`;
                return;
            }
        }).catch((e) => {
            showError(e.message ? e.message : "Something went wrong!");
            button.innerHTML = `Send OTP`;
            console.log(e);
        });
    });
}

fetchCustomer().then(() => {
    if (customerData) window.location.replace("account.html");
    else handleFormSubmit();
});