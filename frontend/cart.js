const cartItemsContainer = document.querySelector(
  ".cart-items-container",
);

const formContainer = document.querySelector(".order-details-container");
const form = document.querySelector(".delivery-details-form");
const totalElement = document.querySelector("#total-price");
const totalDiscountElement = document.querySelector("#total-discount");
const toPayElement = document.querySelector("#to-pay");
const errorBadge = document.querySelector(".error");

// Render Cart Items
cartItemsContainer.innerHTML = null;
const normalizedCart = normalizeCart();
normalizedCart.forEach((item) => {
  cartItemsContainer.innerHTML += cartItemCard(item);
});

// Display Form
function displayForm() {
  if (cart.length > 0) {
    formContainer.style.display = "flex";

    fetchCustomer().then(() => {
      if (customerData) {
        formContainer.querySelector("#phone").value =
          `${customerData.phoneNumber.countryCode}${customerData.phoneNumber.number}`;
      }
    });
  } else {
    formContainer.style.display = "none";
  }
}
displayForm();

// Handle Form
function showError(msg) {
  errorBadge.style.display = "block";
  errorBadge.innerHTML = msg;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  const phone = formData.get("phone");
  const zipCode = formData.get("pin-code").toString();
  const city = "Vadodara";
  const state = "Gujarat";
  const streetNumber = formData.get("street-number");
  const streetName = formData.get("street-name");
  const houseNumber = formData.get("house-number");

  if (phone.length !== 13) {
    showError("Invalid phone number!");
    return;
  }

  const phoneRegex = /^\+91\d{10}$/;
  if (!phoneRegex.test(phone)) {
    showError("Invalid phone number!");
    return;
  }

  const phoneNumber = {
    countryCode: phone.slice(0, 3),
    number: phone.slice(3),
  };

  if (zipCode.length !== 6) {
    showError("Invalid Pin Code!");
    return;
  }

  if (cart.length <= 0) return;

  const deliveryDetails = JSON.stringify({
    phoneNumber,
    items: cart.map((p) => p._id),
    address: {
      zipCode,
      city,
      state,
      street: {
        streetNumber,
        streetName,
        houseNumber,
      },
    },
  });

  const response = await fetch("http://127.0.0.1:3000/api/v1/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: deliveryDetails,
  });

  if (!response.ok) {
    showError("Something went wrong!");
    return;
  }

  const result = await response.json();

  if (result && result.data && result.data.order) {
    formContainer.querySelector("fieldset").disabled = true;

    const options = {
      key: "rzp_test_SS8CpcQNNFUsne",
      amount: result.data.payment.amount * 100, // Amount is in paise.
      currency: "INR",
      name: "Yash Agrawal",
      description: result.data.payment._id,
      order_id: result.data.payment.razorpayOrderId,
      "handler": async function (response) {
        // console.log(response.razorpay_payment_id);
        // console.log(response.razorpay_order_id);
        // console.log(response.razorpay_signature);

        const res = await fetch(
          `http://127.0.0.1:3000/api/v1/payments/${result.data.payment._id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayPaymentSignature: response.razorpay_signature,
            }),
          },
        );

        if (res.ok) {
          console.log("Payment verification successfull");
        } else {
          console.log("Payment verification fail");
        }
        cart = [];
        saveCartToLocalStorage();
        form.reset();
        cartItemsContainer.innerHTML = null;
        renderBill();
        displayForm();
        updateCartQuantity();
        if (customerData) {
          window.location.replace(
            `account.html#order-id-${result.data.order._id}`,
          );
        }
      },
      "modal": {
        "ondismiss": async function () {
          console.log("Payment modal closed by user");
          await fetch(
            `http://127.0.0.1:3000/api/v1/orders/${result.data.order._id}/cancle`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );
        },
      },
    };

    const rzp = new Razorpay(options);
    rzp.on("payment.failed", async function (response) {
      await fetch(
        `http://127.0.0.1:3000/api/v1/payments/${result.data.payment._id}/payment-failure`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "razorpayPaymentId": response.error.metadata.payment_id,
          }),
        },
      );
    });
    rzp.open();
  } else {
    showError("Something went wrong!");
    return;
  }
});

// Render Bill
function renderBill() {
  const total =
    Array.isArray(JSON.parse(localStorage.getItem("vanilla-junction-cart")))
      ? JSON.parse(localStorage.getItem("vanilla-junction-cart")).reduce(
        (acc, curr) => {
          return acc += curr.price * curr.quantity;
        },
        0,
      )
      : 0;

  const totalDiscount =
    Array.isArray(JSON.parse(localStorage.getItem("vanilla-junction-cart")))
      ? JSON.parse(localStorage.getItem("vanilla-junction-cart")).reduce(
        (acc, curr) => {
          return acc += (curr.price * curr.quantity) * curr.discount / 100;
        },
        0,
      )
      : 0;

  totalElement.innerHTML = total.toFixed(2);
  totalDiscountElement.innerHTML = `-${totalDiscount.toFixed(2)}`;
  toPayElement.innerHTML = total - totalDiscount;
}
renderBill();

// Add To Cart / Remove From Cart Functionality
function handleCartContainerEvent() {
  // Add To Cart
  cartItemsContainer.addEventListener("click", (event) => {
    if (event.target && event.target.classList.contains("atc-btn")) {
      const id = event.target.getAttribute("data-id");

      if (!id) return;

      const product = productsData.find((p) => String(p._id) === String(id));
      if (product) {
        cart.push(product);

        document.querySelector(`.cart-item-btns[data-id="${id}"]`).innerHTML =
          cartButtons(id);
        updateCartQuantity();
        saveCartToLocalStorage();
        document.querySelector(`.cart-item-price[data-id="${id}"]`).innerHTML =
          `${renderPrice(
            JSON.parse(localStorage.getItem("vanilla-junction-cart")).find(
              (p) => p._id === product._id,
            ),
          )
          }`;
        renderBill();
        displayForm();
      }
    }

    // Remove From Cart
    if (event.target && event.target.classList.contains("rfc-btn")) {
      const id = event.target.getAttribute("data-id");

      if (!id) return;

      const product = productsData.find((p) => String(p._id) === String(id));
      if (product) {
        const idx = cart.findIndex((ci) => String(ci._id) === String(id));
        cart.splice(idx, 1);

        document.querySelector(`.cart-item-btns[data-id="${id}"]`).innerHTML =
          cartButtons(id);
        updateCartQuantity();
        saveCartToLocalStorage();
        renderBill();
        displayForm();
        const item = JSON.parse(localStorage.getItem("vanilla-junction-cart"))
          .find((p) => p._id === product._id);
        if (!item) {
          cartItemsContainer.querySelector(
            `.cart-item[data-id="${product._id}"]`,
          )
            .remove();
        } else {
          document.querySelector(`.cart-item-price[data-id="${id}"]`)
            .innerHTML = `${renderPrice(item)}`;
        }
      }
    }
  });
}
fetchProducts().then(() => handleCartContainerEvent());