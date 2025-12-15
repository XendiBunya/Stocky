# Stock Anomaly Detection & News Correlation App

A modern Next.js application that detects anomalies in stock price data and correlates them with news events for contextual insights.

## Features

### 📊 Multiple Anomaly Detection Methods
- **Z-Score**: Statistical method using standard deviations
- **IQR (Interquartile Range)**: Robust outlier detection
- **Isolation Forest**: Machine learning-based anomaly detection
- **Bollinger Bands**: Technical analysis approach
- **Combined**: Voting mechanism across multiple methods

### 📈 Comprehensive Stock Analysis
- Historical data analysis with customizable date ranges
- Support for any stock ticker
- Interactive visualizations with Recharts
- Technical indicators (Moving Averages, RSI, Bollinger Bands, Volatility)
- Volume analysis

### 📰 News Correlation
- Automatic matching of anomalies to news events
- Multiple news sources (NewsAPI optional)
- Simple sentiment analysis
- Configurable search window around anomaly dates

### ⚙️ Customization
- Tunable parameters for each detection method
- Feature selection for analysis
- Flexible date range selection (presets and custom ranges)
- Optional NewsAPI integration for enhanced news coverage

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Stock Data**: yahoo-finance2
- **Deployment**: Vercel

## Local Development

### Prerequisites
- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Stocky
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure NewsAPI key:
   - Copy `.env.example` to `.env.local`
   - Get a free API key from [newsapi.org](https://newsapi.org/)
   - Add your API key to `.env.local`:
     ```
     NEWSAPI_KEY=your_api_key_here
     ```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment to Vercel

Vercel is the recommended platform for deploying this Next.js application. It provides zero-configuration deployment with optimal performance.

### Quick Deployment (Recommended)

1. **Push your code to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Deploy with Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/Login with your GitHub account
   - Click "New Project"
   - Import your `Stocky` repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

3. **Your app is live!**
   - Vercel will provide you with a URL like `https://stocky-abc123.vercel.app`
   - Every push to your main branch will auto-deploy

### Vercel CLI Deployment

Alternatively, use the Vercel CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Environment Variables (Optional)

If you want to use NewsAPI:

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add:
   - Name: `NEWSAPI_KEY`
   - Value: `your_api_key_here`
   - Environment: Production, Preview, Development
3. Redeploy your app

## Project Structure

```
Stocky/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main application page
│   ├── globals.css             # Global styles
│   └── api/
│       ├── analyze/route.ts    # Stock analysis endpoint
│       └── news/route.ts       # News fetching endpoint
├── components/
│   ├── ConfigPanel.tsx         # Analysis configuration UI
│   ├── StockChart.tsx          # Stock price charts
│   └── AnomalyDisplay.tsx      # Anomaly results display
├── lib/
│   ├── types.ts                # TypeScript type definitions
│   ├── stockData.ts            # Stock data fetching logic
│   ├── anomalyDetector.ts      # Anomaly detection algorithms
│   ├── newsFetcher.ts          # News fetching and matching
│   └── utils.ts                # Utility functions
├── public/                     # Static assets
├── package.json                # Dependencies
├── next.config.js              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── vercel.json                 # Vercel deployment config
└── README.md                   # This file
```

## Usage Guide

### Basic Workflow

1. **Enter Stock Ticker**:
   - Enter a stock symbol (e.g., AAPL, MSFT, GOOGL, TSLA)

2. **Choose Date Range**:
   - Use quick presets (30D, 3M, 6M, 1Y, 2Y)
   - Or select custom start and end dates

3. **Select Detection Method**:
   - Choose from 5 algorithms
   - Tune method-specific parameters using sliders

4. **Select Features**:
   - Returns: Daily price returns
   - Volume Change: Volume fluctuations
   - Range %: Daily trading range
   - Volatility: Price volatility

5. **Enable News Correlation** (Optional):
   - Toggle on for news matching
   - Optionally add NewsAPI key
   - Set search window (days around anomaly)

6. **Run Analysis**:
   - Click "Run Analysis"
   - View interactive charts
   - Review anomaly table
   - Read correlated news articles

### Example Use Cases

#### 1. Earnings Report Impact
```
Ticker: AAPL
Date Range: Last 3 Months
Method: Z-Score (threshold: 2.5)
Features: Returns, Volume Change
News: Enabled (1-day window)
```

#### 2. Market Volatility Analysis
```
Ticker: TSLA
Date Range: Last 6 Months
Method: Combined (voting: 2)
Features: Returns, Volatility, Range %
News: Enabled (2-day window)
```

#### 3. Historical Event Study
```
Ticker: SPY
Date Range: Jan 2020 - Mar 2020 (COVID crash)
Method: Isolation Forest
Features: All features
News: Enabled
```

## API Routes

### POST /api/analyze
Analyzes stock data and detects anomalies.

**Request Body**:
```json
{
  "ticker": "AAPL",
  "startDate": "2023-01-01",
  "endDate": "2024-01-01",
  "method": "z_score",
  "features": ["returns", "volume_change"],
  "params": { "zThreshold": 3.0 }
}
```

**Response**:
```json
{
  "ticker": "AAPL",
  "stockInfo": { ... },
  "data": [ ... ],
  "summary": { ... },
  "topAnomalies": [ ... ]
}
```

### POST /api/news
Fetches news articles for anomaly dates.

**Request Body**:
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "anomalyDates": ["2023-05-15", "2023-06-20"],
  "windowDays": 1,
  "apiKey": "optional_newsapi_key"
}
```

## Anomaly Detection Algorithms

### 1. Z-Score
- Statistical method based on standard deviations
- Good for normally distributed data
- Threshold: typically 2-4 standard deviations

### 2. IQR (Interquartile Range)
- Robust to extreme outliers
- Uses quartiles instead of mean/std
- Multiplier: typically 1.5-3.0

### 3. Isolation Forest
- Machine learning approach
- Isolates anomalies using random partitions
- Contamination: expected proportion of anomalies (0.01-0.3)

### 4. Bollinger Bands
- Technical analysis indicator
- Detects price breakouts beyond bands
- Based on 20-day moving average ± 2 standard deviations

### 5. Combined
- Runs multiple methods
- Uses voting mechanism
- Reduces false positives
- Threshold: number of methods that must agree (1-3)

## Performance Optimization

- Server-side data fetching via API routes
- Client-side caching of analysis results
- Optimized chart rendering with Recharts
- Edge-compatible API routes on Vercel

## Limitations

- **Historical data**: Limited by Yahoo Finance data availability
- **Real-time data**: 15-minute delay on stock prices
- **News coverage**: Free NewsAPI limited to last 30 days and 100 requests/day
- **Rate limits**: Yahoo Finance may rate-limit excessive requests

## Troubleshooting

### Issue: "No data found for ticker"
- **Solution**: Verify ticker symbol is correct and has trading history

### Issue: News not loading
- **Solution**: NewsAPI has rate limits. Try again later or use without API key

### Issue: Analysis is slow
- **Solution**: Reduce date range or wait for server response (data fetching can take 10-30 seconds)

### Issue: Build fails on Vercel
- **Solution**: Check that all dependencies are in `package.json` and Node version is 18+

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Future Enhancements

- [ ] Advanced sentiment analysis using NLP
- [ ] Real-time monitoring with WebSockets
- [ ] Export functionality (PDF/CSV)
- [ ] Multi-stock comparison view
- [ ] Custom alert thresholds
- [ ] Portfolio-level anomaly detection
- [ ] Machine learning model improvements

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Stock data from [Yahoo Finance](https://finance.yahoo.com/)
- Charts powered by [Recharts](https://recharts.org/)
- News data from [NewsAPI](https://newsapi.org/)
- Deployed on [Vercel](https://vercel.com/)

---

**Happy Analyzing!** 📈📊📰
