# Rosellea

Rosellea is a beauty, skincare, and wellness e-commerce web app built with PHP, MySQL, HTML, CSS, and vanilla JavaScript. It includes a customer storefront, authentication flow, cart and checkout experience, seller portal, and admin dashboard for moderation and inventory control.

## Features

- Customer-facing storefront with hero banners, category browsing, brand filters, and product grid
- Cart system powered by `localStorage`
- User registration and login
- Role-based access for `customer`, `seller`, and `admin`
- Seller onboarding with admin approval
- Seller dashboard for product submission, stock requests, and company profile updates
- Admin dashboard for product management, moderation queue, stock approvals, and seller approvals
- MySQL seed data for demo products and a default admin account

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: PHP
- Database: MySQL
- Icons: Ionicons
- Fonts: Google Fonts

## Project Structure

```text
.
├── index.html          # Main storefront
├── admin.html          # Admin dashboard
├── admin_login.html    # Admin login page
├── seller.html         # Seller dashboard
├── api.php             # Main backend API
├── config.php          # Database connection + session setup
├── setup_db.php        # Runs database.sql setup script
├── database.sql        # Schema + seed data
├── css/style.css       # Shared styles
├── js/app.js           # Storefront logic
├── js/admin.js         # Admin dashboard logic
├── js/seller.js        # Seller dashboard logic
└── img/uploads/        # Uploaded product images
```

## User Roles

### Customer

- Browse products by category and brand
- Add items to cart
- Register, log in, and place orders
- View profile and order history

### Seller

- Register as a seller
- Wait for admin approval
- Submit new products for review
- Request stock increases
- Update company information

### Admin

- Log in through the admin panel
- Add products directly
- Review and approve seller-submitted products
- Approve seller applications
- Review stock increase requests
- Toggle stock availability and delete products

## Local Setup

### Requirements

- PHP 8.x recommended
- MySQL or MariaDB
- XAMPP, MAMP, or any local PHP/MySQL environment

### 1. Clone the project

```bash
git clone <your-repo-url>
cd rosellea
```

### 2. Configure your database

Update the credentials in `config.php` if your local MySQL setup is different:

```php
$host = '127.0.0.1';
$db_name = 'rosellea_db';
$username = 'root';
$password = 'root';
```

### 3. Import the database

Use either of these options:

Option A: Import `database.sql` in phpMyAdmin.

Option B: Run the setup script in your browser:

```text
http://localhost/rosellea/setup_db.php
```

### 4. Start the project

Place the project inside your web server root, then open:

```text
http://localhost/rosellea/
```

## Default Admin Login

Use the seeded admin account from `database.sql`:

- Email: `admin@rosellea.com`
- Password: `admin123`

## Main Pages

- Storefront: `index.html`
- Admin dashboard: `admin.html`
- Seller dashboard: `seller.html`

## Notes

- Cart data is stored in the browser using `localStorage`
- Product image uploads are saved to `img/uploads/`
- Seller accounts are created with `pending` status until approved by an admin
- Seller-submitted products are also queued for moderation before going live

## Future Improvements

- Add payment gateway integration
- Add product search and sorting
- Add email notifications for approvals and orders
- Add better validation and security hardening
- Add order status management and shipment tracking
- Add test coverage

## License

This project is available for personal, academic, and portfolio use. Add a formal license if you plan to distribute it publicly.
