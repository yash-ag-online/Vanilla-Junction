const productsGridContainer = document.querySelector(
    ".products-grid-container",
);

// Fetch Products and Render
function renderProducts() {
    productsGridContainer.innerHTML = null;
    productsData.forEach((p) => {
        productsGridContainer.innerHTML += productCard(p);
    });
}
fetchProducts().then(() => renderProducts());

// Add To Cart / Remove From Cart Functionality
productsGridContainer.addEventListener("click", (event) => {
    // Add To Cart
    if (event.target && event.target.classList.contains("atc-btn")) {
        const id = event.target.getAttribute("data-id");

        if (!id) return;

        const product = productsData.find((p) => String(p._id) === String(id));
        if (product) {
            cart.push(product);

            document.querySelector(`.product-btns[data-id="${id}"]`).innerHTML =
                cartButtons(id);
            updateCartQuantity();
            saveCartToLocalStorage();
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

            document.querySelector(`.product-btns[data-id="${id}"]`).innerHTML =
                cartButtons(id);
            updateCartQuantity();
            saveCartToLocalStorage();
        }
    }
});