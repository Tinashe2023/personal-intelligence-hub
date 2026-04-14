# PIOS — Intelligent Dashboard

> A centralized Next.js dashboard aggregating system metrics, weather, news, emails, research papers, YouTube analytics, and GA4 data.

## 📌 Feature Overview

- **💻 System Metrics**: Real-time CPU, RAM, and disk monitoring via native Node OS module
- **🌦 Weather**: Current weather data from Open-Meteo API
- **📰 News**: Targeted news feeds (quantum, blockchain, geopolitics, AI, KAIST)
- **📧 Emails**: Gmail integration with smart filtering
- **🔬 Research**: Latest research papers from Semantic Scholar (quantum, blockchain, federated learning, LLM)
- **📺 YouTube Analytics**: Channel statistics and performance metrics
- **📊 Website Analytics**: Google Analytics 4 data visualization
- **🔔 Smart Notifications**: Automated data collection via cron scheduler

## 🚀 Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud)
- API Keys: NewsAPI, YouTube, GA4, Gmail OAuth

### Installation

```bash
# Create the project
npx create-next-app@latest pios --js --tailwind --app --no-src-dir

# Install dependencies
cd pios
npm install

# Setup environment
cp .env.local.example .env.local
# Fill in your API keys and credentials
```

### Start Development

```bash
# Terminal 1: Next.js dev server
npm run dev

# Terminal 2: Scheduler for background tasks
npm run scheduler
```

Visit `http://localhost:3000`

## 📁 Project Structure

```
pios/
├── app/
│   ├── page.js                    # Dashboard UI
│   ├── layout.js                  # Root layout
│   ├── globals.css                # Global styles
│   └── api/
│       ├── system/route.js        # System metrics endpoint
│       ├── weather/route.js       # Weather endpoint
│       ├── news/route.js          # News endpoint
│       ├── email/route.js         # Gmail endpoint
│       ├── research/route.js      # Research papers endpoint
│       ├── youtube/route.js       # YouTube analytics endpoint
│       └── analytics/route.js     # GA4 endpoint
├── lib/
│   ├── mongodb.js                 # Database connection
│   ├── system.js                  # System metrics via Node os module
│   ├── weather.js                 # Weather data
│   ├── news.js                    # News fetching
│   ├── gmail.js                   # Gmail integration
│   ├── research.js                # Research papers
│   ├── youtube.js                 # YouTube API
│   └── analytics.js               # GA4 client
├── scheduler/
│   └── index.js                   # Cron jobs for data refresh
├── models/
│   ├── SystemMetric.js            # MongoDB schema
│   ├── WeatherData.js             # MongoDB schema
│   ├── NewsItem.js                # MongoDB schema
│   └── ResearchPaper.js           # MongoDB schema
├── package.json
├── .env.local
├── tailwind.config.js
├── postcss.config.js
└── next.config.js
```

## ⚙️ API Endpoints

| Endpoint         | Method | Purpose                         |
| ---------------- | ------ | ------------------------------- |
| `/api/system`    | GET    | System metrics (CPU, RAM, Disk) |
| `/api/weather`   | GET    | Current weather                 |
| `/api/news`      | GET    | Latest news articles            |
| `/api/email`     | GET    | Filtered Gmail messages         |
| `/api/research`  | GET    | Research papers                 |
| `/api/youtube`   | GET    | YouTube channel stats           |
| `/api/analytics` | GET    | GA4 website analytics           |

## 🔧 Configuration

Edit `.env.local` with your credentials:

```env
MONGODB_URI=mongodb://localhost:27017/pios
NEWS_API_KEY=your_newsapi_key
OPENMETEO_LAT=31.3260
OPENMETEO_LNG=75.5762
YOUTUBE_API_KEY=your_youtube_key
YOUTUBE_CHANNEL_ID=your_channel_id
GA4_PROPERTY_ID=your_ga4_property_id
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
```

## 📅 Scheduler Tasks

The background scheduler runs automated data collection:

- **Every 5 min**: System metrics
- **Every 30 min**: Weather data
- **Every hour**: News articles
- **Every 2 hours**: Research papers

## 🛠 Build for Production

```bash
npm run build
npm start
```

## 📚 Technologies

- **Next.js 14**: React framework
- **Tailwind CSS**: Styling
- **Mongoose**: MongoDB ODM
- **node-cron**: Task scheduling
- **googleapis**: Google services integration

## 📝 License

MIT
