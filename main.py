import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="AURELIA Luxury Fashion API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class Product(BaseModel):
    id: int
    name: str
    price: float
    description: str
    image_url: str

class CartItem(BaseModel):
    id: int
    quantity: int

class PaymentRequest(BaseModel):
    cart: List[CartItem]
    total_amount: float
    customer_name: str
    customer_email: str

class ChatMessage(BaseModel):
    message: str

class ContactForm(BaseModel):
    name: str
    email: str
    inquiry_type: str
    message: str

# --- Dummy Data ---
PRODUCTS = [
    Product(
        id=1,
        name="Obsidian Silk Trench",
        price=1850.00,
        description="A flowing, lightweight trench coat crafted from 100% pure Italian silk.",
        image_url="/assets/images/silk_trench.png"
    ),
    Product(
        id=2,
        name="Champagne Cashmere Wrap",
        price=950.00,
        description="Hand-sourced cashmere wrap, perfect for layering with evening wear.",
        image_url="/assets/images/cashmere_wrap.png"
    ),
    Product(
        id=3,
        name="Aurelia Signature Tote",
        price=2400.00,
        description="Structured leather tote with subtle gold-plated hardware and a minimalist silhouette.",
        image_url="/assets/images/leather_tote.png"
    ),
    Product(
        id=4,
        name="Midnight Velvet Gown",
        price=3200.00,
        description="Floor-length velvet gown featuring an asymmetrical cut and subtle draping.",
        image_url="/assets/images/velvet_gown.png"
    )
]

# --- Endpoints ---

@app.get("/products", response_model=List[Product])
async def get_products():
    return PRODUCTS

@app.post("/process-payment")
async def process_payment(payment: PaymentRequest):
    # Simulate a 2-second payment processing delay
    await asyncio.sleep(2)
    return {"status": "success", "message": "Payment Successful. Thank you for your purchase."}

@app.post("/chat")
async def chat(chat_req: ChatMessage):
    user_msg = chat_req.message.lower()
    
    # Personal Shopper Logic
    if "material" in user_msg or "fabric" in user_msg:
        response = "Our collections are crafted exclusively from the finest materials, including pure Italian silk, hand-sourced cashmere, and ethically tanned leather."
    elif "fit" in user_msg or "size" in user_msg:
        response = "AURELIA pieces are tailored for a relaxed yet architectural fit. We recommend ordering your true size for the intended drape."
    elif "price" in user_msg or "cost" in user_msg:
        response = "Our pieces are an investment in timeless elegance. The current collection ranges from $950 to $3,200."
    elif "hello" in user_msg or "hi" in user_msg:
        response = "Welcome to AURELIA. I am your personal concierge. How may I assist you with our collection today?"
    else:
        response = "A splendid choice. Please let me know if you would like me to arrange a private fitting or if you require further details about any of our pieces."
        
    return {"reply": response}

@app.post("/contact-submit")
async def submit_contact(form: ContactForm):
    # Log the submission (in a real app, send an email or save to DB)
    print(f"Received inquiry from {form.name} ({form.email}): {form.message}")
    return {"status": "success", "message": "Your inquiry has been received. A member of our concierge team will be in touch shortly."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
