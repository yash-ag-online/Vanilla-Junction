function displayCustomerDetails() {
    document.querySelector(".account-phone").innerHTML =
        `Your Mobile: ${customerData.phoneNumber.countryCode}-${customerData.phoneNumber.number}`;

    if (!customerData.savedAddress) {
        document.querySelector(".saved-address").style.display = "none";
    }
    document.querySelector(".saved-address").innerHTML = customerData.savedAddress
        ? `Your Last Address: ${customerData.savedAddress?.street?.houseNumber || ""
        } ${customerData.savedAddress?.street?.streetName || ""} ${customerData.savedAddress?.street?.streetNumber || ""
        }, ${customerData.savedAddress?.city || ""}, ${customerData.savedAddress?.state || ""
        }, ${customerData.savedAddress?.zipCode || ""}`
        : "";
}

async function displayOrderHistory() {
    await fetchOrders();

    // console.log(orders);
    if (orders.length > 0) {
        orders.reverse();
        document.querySelector(".order-history").innerHTML = null;
        for (const order of orders) {
            document.querySelector(".order-history").innerHTML += orderCard(order);
        }
    }
}

fetchCustomer().then(() => {
    if (customerData) {
        displayCustomerDetails();
        displayOrderHistory();
    } else window.location.replace("auth.html");
});