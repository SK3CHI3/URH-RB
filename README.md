# Universal Resource Hub

A platform for discovering free resources across various categories including technology, design, education, business, and more. The platform automatically scrapes and aggregates resources from multiple trusted sources to provide up-to-date learning materials.

## ✨ Features

- **Resource Discovery**
  - Automated resource scraping from multiple sources
  - Browse resources by category
  - Real-time resource filtering
  - Clean and intuitive interface

- **Smart Scraping**
  - Scheduled resource updates every 15 minutes
  - Intelligent duplicate detection
  - Fallback scraping mechanisms
  - Error handling and retry logic

- **User Experience**
  - Light/dark theme toggle
  - Mobile-responsive design
  - Loading states and error handling
  - Fast and efficient resource loading

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express
- **Database:** Supabase
- **Scraping:** Custom scraper with Firecrawl API integration
- **Deployment:** Render/Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
   ```
   git clone https://github.com/SK3CHI3/URH-RB.git
   cd URH-RB
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

4. Start the server
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## 📁 Project Structure

```
URH-RB/
├── public/
│   ├── css/
│   │   ├── styles.css
│   │   └── dark-theme.css
│   ├── js/
│   │   ├── main.js
│   │   ├── resources.js
│   │   ├── config.js
│   │   └── auth.js
│   └── images/
├── server/
│   └── scrapers/
├── server.js
├── package.json
├── .env
└── README.md
```

## 💾 Database Schema

- **Categories**
  - id (primary key)
  - name
  - slug
  - description
  - created_at

- **Resources**
  - id (primary key)
  - title
  - description
  - url
  - image_url
  - source
  - category_id (foreign key)
  - created_at
  - updated_at

## 🔄 Resource Sources

Currently scraping from:
- GeeksGod
- UdemyFreebies
- UdemyKing
- freeCodeCamp
- Smashing Magazine
- Entrepreneur

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history and updates.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. 