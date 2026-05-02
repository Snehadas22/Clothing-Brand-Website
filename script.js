const API_BASE_URL = 'http://127.0.0.1:8000';

// State
let cart = JSON.parse(localStorage.getItem('aurelia_cart')) || [];
let products = [];

// DOM Elements
const cartDrawer = document.getElementById('cartDrawer');
const cartIcon = document.getElementById('cartIcon');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsContainer = document.getElementById('cartItems');
const cartTotalElement = document.getElementById('cartTotal');
const cartCountElement = document.getElementById('cartCount');

// Chat DOM Elements
const chatFab = document.getElementById('chatFab');
const chatWindow = document.getElementById('chatWindow');
const closeChatBtn = document.getElementById('closeChat');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChat');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initHeaderScroll();
    updateCartUI();

    // Event Listeners for Cart
    if (cartIcon) cartIcon.addEventListener('click', toggleCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', toggleCart);

    // Event Listeners for Chat
    if (chatFab) chatFab.addEventListener('click', toggleChat);
    if (closeChatBtn) closeChatBtn.addEventListener('click', toggleChat);
    if (sendChatBtn) sendChatBtn.addEventListener('click', sendMessage);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Load Products if on shop page
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        fetchProducts(productGrid);
    }

    // Contact Form Logic
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Checkout Logic
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
});

// --- Scroll Animations & Header ---
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function initHeaderScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// --- Cart Logic ---
function toggleCart() {
    if (cartDrawer) {
        cartDrawer.classList.toggle('open');
    }
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    toggleCart(); // Open drawer to show added item
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('aurelia_cart', JSON.stringify(cart));
}

function updateCartUI() {
    if (!cartCountElement || !cartItemsContainer || !cartTotalElement) return;

    // Update count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElement.textContent = totalItems;

    // Update items list
    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="color: #888; text-align: center; margin-top: 2rem;">Your cart is empty.</p>';
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)} x ${item.quantity}</p>
                    <button onclick="removeFromCart(${item.id})" style="background:none; border:none; color:#888; text-decoration:underline; cursor:pointer; font-size:0.8rem; margin-top:0.5rem;">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
    }

    // Update total
    cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// --- Fetch API: Products ---
async function fetchProducts(container) {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        products = await response.json();
        
        container.innerHTML = '';
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card fade-in';
            card.innerHTML = `
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <button class="btn-outline add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
            `;
            container.appendChild(card);
        });

        // Add event listeners to newly created buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const product = products.find(p => p.id === id);
                if (product) addToCart(product);
            });
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        container.innerHTML = '<p>Unable to load collection at this time.</p>';
    }
}

// --- Chat Logic ---
function toggleChat() {
    if (chatWindow) {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open') && chatMessages.children.length === 0) {
            // Send initial greeting trigger
            appendMessage('bot', 'Welcome to AURELIA. I am your personal concierge. How may I assist you with our collection today?');
        }
    }
}

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage('user', text);
    chatInput.value = '';

    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();
        appendMessage('bot', data.reply);
    } catch (error) {
        console.error("Chat Error:", error);
        appendMessage('bot', 'Apologies, I am currently unavailable. Please contact our support team directly.');
    }
}

function appendMessage(sender, text) {
    if (!chatMessages) return;
    const msgEl = document.createElement('div');
    msgEl.className = `message ${sender}`;
    msgEl.textContent = text;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// --- Forms & Checkout Logic ---
async function handleContactSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const formData = {
        name: form.name.value,
        email: form.email.value,
        inquiry_type: form.inquiry_type.value,
        message: form.message.value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/contact-submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        form.innerHTML = `<h3 style="color: var(--champagne); text-align:center;">${data.message}</h3>`;
    } catch (error) {
        console.error("Contact Error:", error);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        alert("There was an error sending your message. Please try again.");
    }
}

async function handleCheckout() {
    if (cart.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    checkoutBtn.textContent = 'Processing Payment...';
    checkoutBtn.disabled = true;

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const payload = {
        cart: cart,
        total_amount: total,
        customer_name: document.getElementById('checkoutName').value || 'Guest',
        customer_email: document.getElementById('checkoutEmail').value || 'guest@example.com'
    };

    try {
        const response = await fetch(`${API_BASE_URL}/process-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            cart = []; // Empty cart
            saveCart();
            document.querySelector('.checkout-container').innerHTML = `
                <div style="text-align: center; padding: 4rem 0;">
                    <h2 style="color: var(--champagne);">${data.message}</h2>
                    <p>Your order is being prepared with the utmost care.</p>
                    <a href="index.html" class="btn-primary" style="margin-top:2rem;">Return to Boutique</a>
                </div>
            `;
        }
    } catch (error) {
        console.error("Payment Error:", error);
        checkoutBtn.textContent = 'Complete Purchase';
        checkoutBtn.disabled = false;
        alert("Payment processing failed. Please try again.");
    }
}
