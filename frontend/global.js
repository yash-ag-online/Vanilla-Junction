let productsData = [];
let cart = [];
let customerData = null;
let orders = [];

const cartButtons = (productId) => {
  const quantityInCart =
    cart.filter((ci) => String(productId) === String(ci._id)).length;

  if (quantityInCart > 0) {
    return `
        <button class="atc-btn button" data-id="${productId}">+</button> <p>${quantityInCart}</p> <button class="rfc-btn button" data-id="${productId}">-</button>
        `;
  } else {
    return `
        <button class="atc-btn button" data-id="${productId}">Add to cart</button>
        `;
  }
};

const productCard = (productData) => {
  const price =
    (productData.price - (productData.price * productData.discount / 100))
      .toFixed(2);

  return `
    <div class="product-card">
      <div class="product-image-container">
        <img
          src="${productData.image || "https://placehold.co/400"}"
          alt="${productData.name || "Product Image"}"
          class="product-image"
        >
      </div>
      <div class="product-content-container">
        <div>
          <p class="product-name">${productData.name || ""}</p>
          <p class="product-desc">${productData.description || ""}</p>
        </div>
        <div class="product-pricing">
          <p class="product-price">₹${price} <span class="actual-price">₹${productData.price || ""
    }</span></p>
          ${productData.discount > 0
      ? `<span class="product-offer">${productData.discount}% off</span>`
      : ""
    }
        </div>
        <div class="product-btns" data-id="${productData._id}">
          ${cartButtons(productData._id)}
        </div>
      </div>
    </div>
    `;
};

async function fetchProducts() {
  try {
    const response = await fetch(`http://127.0.0.1:3000/api/v1/ice-creams`);
    if (!response.ok) throw new Error("Products api failed!");

    const result = await response.json();
    if (result && result.data && result.data.icecreams) {
      const data = result.data.icecreams;
      productsData = Array.isArray(data) ? data : [];
    } else {
      throw new Error("Invalid products api response!");
    }
  } catch (error) {
    console.error(error);
    productsData = [];
  }
}

function normalizeCart() {
  const normalizedCart = cart.reduce((acc, curr) => {
    const indexInAcc = acc.findIndex((p) => String(p._id) === String(curr._id));
    if (indexInAcc >= 0) {
      acc[indexInAcc].quantity += 1;
      return acc;
    } else {
      return [...acc, { ...curr, quantity: 1 }];
    }
  }, []);

  return normalizedCart;
}

function saveCartToLocalStorage() {
  const normalizedCart = normalizeCart();
  localStorage.setItem("vanilla-junction-cart", JSON.stringify(normalizedCart));
}

function syncCartFromLocalStorage() {
  cart = [];
  const localCart = JSON.parse(localStorage.getItem("vanilla-junction-cart")) ||
    [];

  if (Array.isArray(localCart)) {
    localCart.forEach((ci) => {
      if (ci.quantity > 1) {
        for (let i = 0; i < ci.quantity; i++) {
          cart.push(ci);
        }
      } else cart.push(ci);
    });
  }
}
syncCartFromLocalStorage();

if (
  window.location.pathname !== "/auth" &&
  window.location.pathname !== "/auth.html"
) {
  const cartQuantityElement = document.querySelector(".cart-quantity");
  function updateCartQuantity() {
    cartQuantityElement.innerHTML = cart.length > 0 ? cart.length : null;
    cartQuantityElement.style.display = cart.length > 0 ? "flex" : "none";
  }
  updateCartQuantity();
}

function renderPrice(cartItemData) {
  const price = ((cartItemData.price -
    (cartItemData.price * cartItemData.discount / 100)) *
    cartItemData.quantity).toFixed(2);
  return `₹${price} <span class="actual-price">₹${cartItemData.price * cartItemData.quantity
    }</span>`;
}

const cartItemCard = (cartItemData) => {
  return `
    <div class="cart-item" data-id="${cartItemData._id}">
      <div class="cart-item-image">
        <img
          src="${cartItemData.image || ""}"
          alt="${cartItemData.name || ""}"
        >
      </div>
      <div class="cart-item-content">
        <div>
          <p class="cart-item-name">${cartItemData.name || ""}</p>
          <p class="cart-item-desc">${cartItemData.description || ""}</p>
        </div>
        <div class="cart-item-info">
          <div class="cart-item-pricing">
            <p class="cart-item-price" data-id="${cartItemData._id}">${renderPrice(cartItemData)
    }</p>
  ${cartItemData.discount > 0
      ? `<span class="cart-item-offer">${cartItemData.discount}% off</span>`
      : ""
    }  
          </div>
          <div class="cart-item-btns" data-id="${cartItemData._id}">
            ${cartButtons(cartItemData._id)}
          </div>
        </div>
      </div>
    </div>
    `;
};

async function refreshToken() {
  try {
    const response = await fetch(
      `http://127.0.0.1:3000/api/v1/customers/me/refresh-tokens`,
      {
        method: "POST",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error("Invalid refresh token!");
    }

    const result = await response.json();

    if (result && result.data && result.data.newTokens) {
      const response = await fetch(
        `http://127.0.0.1:3000/api/v1/customers/me`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Customer api failed!");
      }

      const res = await response.json();

      if (res && res.data && res.data.customer) {
        return res.data.customer;
      } else {
        throw new Error("Invalid customer api response!");
      }
    } else {
      throw new Error("Invalid refresh token api response!");
    }
  } catch (error) {
    console.log(error);
  }
}

async function fetchCustomer() {
  try {
    const response = await fetch(`http://127.0.0.1:3000/api/v1/customers/me`, {
      credentials: "include",
    });

    if (response.status === 401) {
      refreshToken().then((data) => customerData = data);
      return;
    }

    if (!response.ok) throw new Error("Customer api failed!");

    const result = await response.json();

    if (result && result.data && result.data.customer) {
      customerData = result.data.customer;
      return;
    } else {
      throw new Error("Invalid customer api response!");
    }
  } catch (error) {
    console.log(error);
  }
}

async function fetchOrders() {
  if (customerData) {
    const orderIds = customerData.orderHistory;
    if (Array.isArray(orderIds)) {
      const apiArray = orderIds.map((id) =>
        `http://127.0.0.1:3000/api/v1/orders/${id}`
      );
      try {
        const responses = await Promise.all(apiArray.map((a) => fetch(a)));
        for (const response of responses) {
          if (!response.ok) throw new Error(`Order api failed  - ${response}!`);
          const result = await response.json();
          if (result && result.data && result.data.order) {
            const data = result.data.order;
            orders.push(data);
          } else {
            throw new Error(`Invalid order api response - ${response}!`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      console.error("orderIds must be passed as array");
      orders = [];
    }
  }
}

const orderCard = (orderData) => {
  return `
  <div class="order-history-card" id="order-id-${orderData._id}">
   
              <!-- 
              <ul class="order-list">
                <li>
                  <div class="order-list-item flex-btw">
                    <div>
                      Lorem ipsum dolor sit. x 2
                    </div>
                    <div>94</div>
                  </div>
                </li>
                <li>
                  <div class="order-list-item flex-btw">
                    <div>
                      Lorem ipsum dolor sit amet. x 2
                    </div>
                    <div>94</div>
                  </div>
                </li>
                <li>
                  <div class="order-list-item flex-btw">
                    <div>
                      Lorem, ipsum dolor. x 2
                    </div>
                    <div>94</div>
                  </div>
                </li>
                <li>
                  <div class="order-list-item flex-btw">
                    <div>
                      Lorem ipsum dolor sit amet consectetur. x 2
                    </div>
                    <div>94</div>
                  </div>
                </li>
              </ul>
              -->

              <div class="flex">
                <span class="badge total">Total: ₹${parseInt((orderData.totalPrice - orderData.totalDiscount) * 100) / 100
    }</span>
                <!-- <button class="button">Download Bill</button> -->
                <span class="badge">#${orderData._id}</span>
              </div>

              <div class="group">
                <span class="badge">${(new Date(orderData.createdAt).toLocaleTimeString("en-IN")).toUpperCase()
    }</span>
                <span class="badge">${(new Date(orderData.createdAt)
      .getDate())}-${(new Date(orderData.createdAt).getMonth())}-${(new Date(
        orderData.createdAt,
      ).getFullYear())}</span>
                <div class="badge">
                  ${orderData.deliveryAddress
      ? `
                    ${orderData.deliveryAddress.street?.houseNumber || ""} ${orderData.deliveryAddress.street?.streetName || ""
      } ${orderData.deliveryAddress.street?.streetNumber || ""}, ${orderData.deliveryAddress.city || ""
      }, ${orderData.deliveryAddress.state || ""}, ${orderData.deliveryAddress.zipCode || ""
      }
                    `
      : ""
    }
                </div>
                <span class="badge">${orderData.deliveryStatus}</span>
              </div>
            </div>
  `;
};
