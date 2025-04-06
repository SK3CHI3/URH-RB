# Universal Resource Hub

A platform for discovering free resources across various categories including technology, design, education, business, books, music, and more.

## Features

- Browse resources by category
- Search for specific resources
- Filter and sort resources
- Light/dark theme toggle
- Mobile-responsive design
- User authentication (planned)
- User interest selection (planned)
- Notification system (planned)

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** Supabase
- **Authentication:** Supabase Auth
- **Email Notifications:** Nodemailer

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/universal-resource-hub.git
   cd universal-resource-hub
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   - Create a `.env` file in the root directory
   - Add the following variables:
     ```
     PORT=3000
     SUPABASE_URL=your_supabase_url
     SUPABASE_KEY=your_supabase_key
     NODE_ENV=development
     ```

4. Start the development server
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Project Structure

```
universal-resource-hub/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── images/
├── server.js
├── package.json
├── .env
└── README.md
```

## Database Schema (Planned)

- **Users**
  - id (primary key)
  - email
  - password (hashed)
  - name
  - created_at
  - updated_at

- **Categories**
  - id (primary key)
  - name
  - icon
  - description
  - created_at

- **Resources**
  - id (primary key)
  - title
  - description
  - url
  - image_url
  - rating
  - source
  - category_id (foreign key)
  - created_at
  - updated_at

- **UserInterests**
  - id (primary key)
  - user_id (foreign key)
  - category_id (foreign key)
  - created_at

## License

MIT 