## Authentication Endpoints

- `POST /api/v1/auth/login` - User login with credentials
- `POST /api/v1/auth/register` - Create new user account
- `POST /api/v1/auth/reset` - Reset password
- `POST /api/v1/auth/verify` - Verify account
- `POST /api/v1/auth/send-code` - Send verification code
- `GET /api/v1/auth/2fa` - Generate 2FA setup QR code
- `PUT /api/v1/auth/2fa` - Toggle 2FA
- `POST /api/v1/auth/refresh` - Refresh JWT token

## Book Endpoints

- `GET /api/v1/books` - Get all books with filtering
- `GET /api/v1/books/:bookId` - Get specific book details
- `POST /api/v1/books` - Create a new book (admin/librarian)
- `PATCH /api/v1/books/:bookId` - Update a book (admin/librarian)
- `DELETE /api/v1/books/:bookId` - Delete a book (admin/librarian)
- `GET /api/v1/books/search` - Search for books
- `POST /api/v1/books/:bookId/borrow` - Borrow a book
- `POST /api/v1/books/:bookId/return` - Return a book
- `POST /api/v1/books/:bookId/reserve` - Reserve a book
- `POST /api/v1/books/:bookId/cancel-reservation` - Cancel reservation
- `GET /api/v1/books/borrowed` - Get user's borrowed books
- `GET /api/v1/books/reserved` - Get user's reserved books
- `GET /api/v1/books/borrowed/:userId` - Get books borrowed by specific user (admin/librarian)
- `GET /api/v1/books/reserved/:userId` - Get books reserved by specific user (admin/librarian)
- `GET /api/v1/books/stats` - Get borrowing statistics (admin)
- `POST /api/v1/books/import` - Import books from file (admin)
- `GET /api/v1/books/export` - Export books catalog (admin)

## User Endpoints

- `GET /api/v1/users` - Get all users (admin/librarian)
- `GET /api/v1/users/:userId` - Get specific user (admin/librarian)
- `POST /api/v1/users` - Create a new user (admin)
- `PATCH /api/v1/users/:userId` - Update user (admin/librarian)
- `DELETE /api/v1/users/:userId` - Delete user (admin)
- `GET /api/v1/users/profile` - Get current user profile
- `PATCH /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/favorites` - Get user's favorite books
- `POST /api/v1/users/favorites/:bookId` - Add book to favorites
- `DELETE /api/v1/users/favorites/:bookId` - Remove from favorites
- `GET /api/v1/users/notifications` - Get user notifications
- `POST /api/v1/users/notifications/:notificationId/read` - Mark notification as read
- `POST /api/v1/users/notifications/read-all` - Mark all notifications as read

## Admin Metrics Endpoints

- `GET /api/v1/admin/metrics` - Get system metrics and dashboard data
