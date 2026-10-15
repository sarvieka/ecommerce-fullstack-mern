# ShopKart — Full-Stack E-Commerce Application

ShopKart is an end-to-end full-stack e-commerce application built to practice and understand how a modern MERN-style commerce application works across the frontend, backend, database, authentication, state management, and payment layers.

The project covers the complete customer journey — from browsing products and managing a cart to checkout, Razorpay test payments, order creation, and order confirmation.

> This project was built as a full-stack learning and practice project with a focus on understanding backend architecture, API design, authentication, database relationships, business logic, and payment integration.

---

## Features

### Authentication
- Customer registration and login
- Password hashing using bcrypt
- JWT-based authentication
- JWT stored in an HttpOnly cookie
- Protected backend routes
- Logout functionality
- Authenticated customer profile retrieval

### Products
- Product creation
- Product listing
- Individual product retrieval
- Product search
- Category filtering
- Server-side product validation

### Wishlist
- Add products to wishlist
- View wishlist
- Remove products from wishlist
- Duplicate wishlist prevention
- Product references using MongoDB ObjectIds

### Shopping Cart
- Add products to cart
- Increase product quantity
- Update quantity
- Remove products
- Stock validation
- Server-side cart validation
- Persistent cart stored in MongoDB
- Redux-based frontend cart state

### Checkout & Orders
- Shipping address form
- Client-side form validation
- Server-side stock verification
- Server-side order total calculation
- Order creation
- Product snapshots stored inside orders
- Order status management
- Payment status management
- Order confirmation flow

### Razorpay Payments
- Razorpay Test Mode integration
- Backend-created Razorpay orders
- Razorpay Checkout integration
- Payment ID capture
- Razorpay signature verification
- Secure server-side payment verification
- Cart cleared only after successful payment verification

---

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Redux
- Axios
- JavaScript
- HTML
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcrypt
- cookie-parser
- CORS

### Payments

- Razorpay Test Mode

### Database

- MongoDB Atlas

---

## Project Architecture

```text
ShopKart
│
├── shopkart-backend
│   ├── config
│   ├── controllers
│   ├── middlewares
│   ├── models
│   ├── routes
│   ├── utils
│   ├── index.js
│   ├── package.json
│   └── .env
│
└── shopkart-frontend
    ├── src
    │   ├── components
    │   ├── pages
    │   ├── services
    │   ├── store
    │   └── ...
    ├── package.json
    └── ...
```

The application follows a separation between:

```text
React Frontend
      ↓
Axios API Requests
      ↓
Express Routes
      ↓
Controllers
      ↓
Mongoose Models
      ↓
MongoDB Atlas
```

---

## Application Flow

The complete shopping and payment flow is:

```text
Browse Products
      ↓
Add to Cart
      ↓
Proceed to Checkout
      ↓
Enter Shipping Details
      ↓
Backend Validates Cart
      ↓
Backend Checks Latest Stock
      ↓
Backend Calculates Total
      ↓
ShopKart Order Created
      ↓
Razorpay Order Created
      ↓
Razorpay Checkout
      ↓
Customer Completes Test Payment
      ↓
Razorpay Returns Payment Details
      ↓
Backend Verifies Razorpay Signature
      ↓
Order → PAID / PLACED
      ↓
Cart Cleared
      ↓
Order Confirmation
      ↓
Order History
```

---

## Backend API

### Customer Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/customers/register` | Register a customer |
| POST | `/customers/login` | Login |
| GET | `/customers/me` | Get authenticated customer |
| POST | `/customers/logout` | Logout |

### Products

| Method | Endpoint | Description |
|---|---|---|
| POST | `/products` | Create a product |
| GET | `/products` | Get products |
| GET | `/products/:id` | Get a product by ID |

Product listing supports query parameters such as:

```text
GET /products?search=keyboard
GET /products?category=Electronics
GET /products?search=keyboard&category=Electronics
```

### Wishlist

| Method | Endpoint | Description |
|---|---|---|
| POST | `/wishlist/:productId` | Add product to wishlist |
| GET | `/wishlist` | Get wishlist |
| DELETE | `/wishlist/:productId` | Remove product from wishlist |

### Cart

| Method | Endpoint | Description |
|---|---|---|
| POST | `/cart/:productId` | Add product to cart |
| GET | `/cart` | Get cart |
| PATCH | `/cart/:productId` | Update quantity |
| DELETE | `/cart/:productId` | Remove product |

### Orders & Payments

| Method | Endpoint | Description |
|---|---|---|
| POST | `/orders/create-payment-order` | Create ShopKart and Razorpay payment order |
| POST | `/orders/verify-payment` | Verify Razorpay payment |

Protected endpoints require the authenticated customer's JWT cookie.

---

## Database Models

### Customer

A customer contains authentication information along with their wishlist and cart.

```text
Customer
├── fullName
├── email
├── password
├── phone
├── wishlist[]
├── cart[]
└── createdAt
```

The cart stores product references and quantities:

```text
cart
├── product → Product ObjectId
└── quantity
```

The wishlist stores references to products rather than duplicating product data.

---

### Product

```text
Product
├── name
├── description
├── price
├── category
├── image
├── stock
├── createdAt
└── updatedAt
```

---

### Order

Orders store a historical snapshot of purchased products.

```text
Order
├── user
├── items[]
│   ├── product
│   ├── name
│   ├── price
│   ├── quantity
│   └── image
├── shippingAddress
├── totalAmount
├── paymentStatus
├── status
├── razorpayOrderId
├── razorpayPaymentId
├── createdAt
└── updatedAt
```

Product name and price are stored inside the order as snapshots so that historical orders remain accurate even if the Product document changes later.

---

## Payment Security

The payment flow intentionally keeps sensitive payment credentials on the backend.

The Razorpay Key Secret is never exposed to the React frontend.

The flow is:

```text
Frontend
    ↓
Request payment order
    ↓
Backend
    ↓
Create Razorpay Order
    ↓
Return public Key ID + Razorpay Order ID
    ↓
Frontend opens Razorpay Checkout
    ↓
Customer completes payment
    ↓
Razorpay returns:
    ├── razorpay_order_id
    ├── razorpay_payment_id
    └── razorpay_signature
    ↓
Frontend sends these to backend
    ↓
Backend verifies signature using
RAZORPAY_KEY_SECRET
    ↓
Payment verified
```

The cart is only cleared after successful server-side payment verification.

---

## Business Logic

Important business rules are enforced on the backend rather than trusting the frontend.

### Server-Side Total Calculation

The frontend does not determine the final trusted order amount.

The backend retrieves the latest product prices and calculates:

```text
totalAmount = product.price × quantity
```

for each cart item.

### Stock Verification

Stock is checked again during checkout because inventory may have changed after the product was originally added to the cart.

### Order Snapshots

Orders store product information such as name and price at the time of purchase.

This prevents historical orders from changing when the current Product document changes.

### User-Specific Orders

Orders reference the authenticated customer, ensuring that users can only access their own order data.

---

## Prerequisites

Before running the project, make sure you have:

- Node.js installed
- npm installed
- A MongoDB Atlas account
- A MongoDB Atlas cluster
- A Razorpay account with Test Mode enabled

---

## Installation

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd shopkart-fullstack
```

---

### 2. Set up the backend

```bash
cd shopkart-backend
npm install
```

Create a `.env` file inside `shopkart-backend`:

```env
PORT=3000

MONGO_URI=your_mongodb_atlas_connection_string

JWT_SECRET=your_jwt_secret

RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
```

Replace the placeholder values with your own credentials.

> Never commit your `.env` file or Razorpay secret key to GitHub.

---

### 3. Start the backend

From the `shopkart-backend` directory:

```bash
node index.js
```

The backend should run on:

```text
http://localhost:3000
```

---

### 4. Set up the frontend

Open another terminal:

```bash
cd shopkart-frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will usually be available at:

```text
http://localhost:5173
```

---

## Environment Variables

The backend requires the following environment variables:

| Variable | Purpose |
|---|---|
| `PORT` | Port used by the Express server |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret used to sign and verify JWTs |
| `RAZORPAY_KEY_ID` | Razorpay Test Mode public key |
| `RAZORPAY_KEY_SECRET` | Razorpay Test Mode secret |

Keep all secret values in `.env`.

The `.env` file should be included in `.gitignore`.

---

## Razorpay Test Mode

This project uses Razorpay Test Mode.

No real money should be charged when using Razorpay's test environment.

To test payments:

1. Configure Razorpay Test Mode credentials.
2. Start the backend.
3. Start the frontend.
4. Log in to ShopKart.
5. Add a product to the cart.
6. Proceed to checkout.
7. Enter shipping details.
8. Click `Place Order`.
9. Complete the payment using Razorpay's test environment.
10. The frontend sends the Razorpay payment details to the backend.
11. The backend verifies the payment signature.
12. The order is marked as `PAID` and `PLACED`.
13. The cart is cleared.
14. The user is redirected to the order confirmation flow.

---

## Authentication Flow

Authentication uses JWT stored in an HttpOnly cookie.

```text
Register
   ↓
Password hashed using bcrypt
   ↓
Customer stored in MongoDB
```

For login:

```text
Login
   ↓
Backend verifies password
   ↓
JWT generated
   ↓
JWT stored in HttpOnly cookie
   ↓
Authenticated requests include cookie
   ↓
Auth middleware verifies JWT
   ↓
req.customerId identifies the customer
```

The frontend does not directly handle or store the JWT.

---

## State Management

Redux is used for frontend global state, particularly the shopping cart.

The application has two representations of the cart:

```text
Frontend
   ↓
Redux cart state
   ↓
Used for UI and immediate updates

Backend
   ↓
MongoDB Customer.cart
   ↓
Persistent server-side cart
```

After successful payment verification:

```text
Backend cart → cleared
Redux cart → cleared
```

This keeps the frontend and backend state synchronized.

---

## Project Goals

This project was primarily built to practise:

- Full-stack application architecture
- REST API development
- MVC backend structure
- MongoDB data modeling
- Mongoose relationships
- JWT authentication
- HttpOnly cookie authentication
- React state management
- Redux
- API integration with Axios
- Server-side validation
- Business logic enforcement
- Payment gateway integration
- Payment signature verification
- Order lifecycle management
- Frontend/backend state synchronization

---

## Key Learning Outcomes

Through this project, I practised building an application where the frontend is not treated as the source of truth for sensitive business operations.

Important backend responsibilities include:

- Authentication
- Authorization
- Product validation
- Stock verification
- Price calculation
- Order creation
- Payment verification
- Cart clearing
- User-specific data access

This helped me understand how frontend interfaces, backend APIs, databases, authentication, state management, and external payment services work together in a complete application.

---

## Future Improvements

Possible future improvements include:

- Admin dashboard
- Product image upload
- Product reviews and ratings
- Pagination
- Advanced product filtering
- Inventory management
- Order cancellation
- Refund handling
- Email order confirmations
- Deployment
- Production Razorpay integration
- Improved error handling and monitoring

---

## Disclaimer

This project is an educational/full-stack practice implementation.

Razorpay is configured in **Test Mode** and is intended only for payment-flow experimentation and learning.

No production payment credentials should be committed to this repository.

---

## Author

**Sarvika Sharma**

Built as an end-to-end full-stack e-commerce practice project while learning and applying MERN/full-stack development concepts.
