# Universal Resource Hub

A platform for discovering free resources across various categories including technology, design, education, business, and more. The platform automatically scrapes and aggregates resources from multiple trusted sources to provide up-to-date learning materials.

## ✨ Features

- **Resource Discovery**
  - Automated resource scraping from multiple sources
  - Browse resources by category
  - Real-time resource filtering
  - Clean and intuitive interface

- **Smart Scraping**
  - Scheduled resource updates twice daily (noon and midnight)
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
- **Process Management:** PM2

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
     FIRECRAWL_API_KEY=your_firecrawl_api_key (optional)
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
├── scraper.js
├── cron.js
├── deploy-scraper.js
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

## �� Resource Sources

Our scraper collects resources from a diverse range of sites across multiple categories:

### Education
- GeeksGod
- UdemyFreebies
- UdemyKing
- CourseFolder

### Technology
- freeCodeCamp
- DigitalOcean Tutorials
- Hackernoon
- Mozilla Developer Network (MDN)

### Design
- Smashing Magazine
- DesignModo
- UI Garage
- UI8 Freebies

### Business
- Entrepreneur
- HubSpot Resources
- SCORE Templates
- Forbes Business

### Events
- Devpost Hackathons
- EventBrite Tech Events
- Luma Kenya
- TechCabal Events

### Blogs & News
- The Hacker News
- TechRadar
- Wired Tech
- Dev.to
- Hashnode

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history and updates.

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🤖 Web Scraper

The application includes an automatic web scraper that collects resources from popular websites. The scraper is designed to run independently of the web server, ensuring continuous resource collection even if the main application is down.

### 🔧 Running the Scraper

#### Option 1: As a standalone service (recommended for production)

Deploy the scraper as an independent service that runs regardless of the web server status:

```
npm run deploy-scraper
```

This will:
- Set up the scraper as a PM2 process
- Configure it to restart automatically if it crashes
- Save the process configuration for system restarts

To ensure the scraper starts automatically when the system boots:

```
npm run setup-startup
```

Follow the instructions displayed to complete the setup.

#### Option 2: Running manually

For one-time scraping:

```
npm run scrape
```

#### Option 3: Simple scheduler

Run the scheduler directly (will stop if terminal is closed):

```
npm run cron
```

### 📊 Managing the Scraper Service

View scraper logs:
```
npm run scraper-logs
```

Check scraper status:
```
npm run scraper-status
```

Restart the scraper:
```
npm run scraper-restart
```

Stop the scraper:
```
npm run scraper-stop
```

Remove the scraper service:
```
npm run scraper-delete
```

### ⏰ Scheduled Execution

The scraper is configured to run automatically at:
- 12:00 AM (midnight) every day
- 12:00 PM (noon) every day

It will also run once immediately upon deployment.

## 💻 Development

For development with automatic server restart:

```
npm run dev
``` 