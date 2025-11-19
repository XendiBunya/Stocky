# Stock Anomaly Detection & News Correlation App

A powerful Streamlit application that detects anomalies in stock price data and correlates them with news events for contextual insights.

## Features

### 📊 Multiple Anomaly Detection Methods
- **Z-Score**: Statistical method using standard deviations
- **IQR (Interquartile Range)**: Robust outlier detection
- **Isolation Forest**: Machine learning-based anomaly detection
- **Bollinger Bands**: Technical analysis approach
- **Combined**: Voting mechanism across multiple methods

### 📈 Comprehensive Stock Analysis
- Historical data analysis with customizable date ranges
- Support for multiple stock tickers
- Interactive visualizations with Plotly
- Technical indicators (Moving Averages, RSI, Bollinger Bands, Volatility)
- Volume analysis

### 📰 News Correlation
- Automatic matching of anomalies to news events
- Multiple news sources (NewsAPI, Yahoo Finance)
- Simple sentiment analysis
- Configurable search window around anomaly dates

### ⚙️ Customization
- Tunable parameters for each detection method
- Feature selection for analysis
- Flexible date range selection (presets and custom ranges)
- Optional NewsAPI integration for enhanced news coverage

## Installation

### Local Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Stocky
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. (Optional) Configure NewsAPI key:
   - Get a free API key from [newsapi.org](https://newsapi.org/)
   - Copy `.streamlit/secrets.toml.example` to `.streamlit/secrets.toml`
   - Add your API key to the secrets file

4. Run the application:
```bash
streamlit run app.py
```

The app will open in your browser at `http://localhost:8501`

## Deployment to Streamlit Community Cloud

### Prerequisites
- A GitHub account
- Your code pushed to a GitHub repository

### Step-by-Step Deployment

1. **Push your code to GitHub**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Sign up for Streamlit Community Cloud**:
   - Go to [share.streamlit.io](https://share.streamlit.io/)
   - Sign in with your GitHub account

3. **Deploy your app**:
   - Click "New app"
   - Select your repository: `XendiBunya/Stocky`
   - Set the branch (e.g., `main` or your feature branch)
   - Set the main file path: `app.py`
   - Click "Deploy"

4. **(Optional) Add secrets for NewsAPI**:
   - In your deployed app dashboard, click "⚙️ Settings"
   - Go to "Secrets"
   - Add your NewsAPI key:
     ```toml
     newsapi_key = "your_actual_api_key_here"
     ```
   - Click "Save"

5. **Access your app**:
   - Your app will be available at: `https://share.streamlit.io/[username]/stocky/[branch]/app.py`
   - Share this URL with others!

### Deployment Tips

- **Free tier limits**: Streamlit Community Cloud has resource limits. The app works well for analysis of 1-2 stocks at a time.
- **Cold starts**: Apps may take a few seconds to wake up if they haven't been accessed recently.
- **Updates**: Any push to your GitHub repository will automatically redeploy the app.
- **Monitoring**: Check the app logs in the Streamlit Cloud dashboard for debugging.

## Usage Guide

### Basic Workflow

1. **Select Stock Ticker(s)**:
   - Enter one or more stock tickers (e.g., AAPL, MSFT, GOOGL)
   - Multiple tickers should be comma-separated

2. **Choose Date Range**:
   - Use presets (Last 30 Days, 3 Months, 6 Months, Year, 2 Years)
   - Or select custom start and end dates for historical testing

3. **Configure Anomaly Detection**:
   - Select a detection method
   - Tune method-specific parameters:
     - **Z-Score**: Adjust threshold (higher = fewer anomalies)
     - **IQR**: Adjust multiplier (higher = fewer anomalies)
     - **Isolation Forest**: Set contamination rate and estimators
     - **Bollinger Bands**: Uses standard settings
     - **Combined**: Set voting threshold

4. **Select Features**:
   - Choose which metrics to analyze:
     - Returns: Daily price returns
     - Volume_Change: Volume fluctuations
     - Range_Pct: Daily trading range
     - Volatility: Price volatility

5. **Enable News Correlation** (Optional):
   - Toggle news correlation on/off
   - Add NewsAPI key for better coverage (or use Yahoo Finance)
   - Set search window (days before/after anomaly)

6. **Run Analysis**:
   - Click "Run Analysis"
   - View results, charts, and news correlations

### Example Use Cases

#### 1. Detecting Earnings Report Impact
```
Ticker: AAPL
Date Range: Last 3 Months
Method: Z-Score (threshold: 2.5)
Features: Returns, Volume_Change
News: Enabled (1-day window)
```

#### 2. Finding Market Crashes or Rallies
```
Ticker: SPY (S&P 500 ETF)
Date Range: Last Year
Method: Combined (voting: 2)
Features: Returns, Volatility
News: Enabled (2-day window)
```

#### 3. Volatility Analysis
```
Ticker: TSLA
Date Range: Custom (6 months ago to today)
Method: Bollinger Bands
Features: Returns, Range_Pct, Volatility
News: Enabled
```

## Project Structure

```
Stocky/
├── app.py                          # Main Streamlit application
├── modules/
│   ├── stock_data.py              # Stock data fetching (yfinance)
│   ├── anomaly_detector.py        # Anomaly detection algorithms
│   └── news_fetcher.py            # News fetching and correlation
├── .streamlit/
│   ├── config.toml                # Streamlit configuration
│   └── secrets.toml.example       # Example secrets file
├── requirements.txt               # Python dependencies
├── .gitignore                     # Git ignore rules
└── README.md                      # This file
```

## Technical Details

### Dependencies
- **streamlit**: Web application framework
- **yfinance**: Stock data fetching
- **pandas**: Data manipulation
- **numpy**: Numerical computing
- **plotly**: Interactive visualizations
- **scikit-learn**: Machine learning (Isolation Forest)
- **scipy**: Statistical functions
- **requests**: HTTP requests for news
- **beautifulsoup4**: HTML parsing for news
- **newsapi-python**: NewsAPI client

### Anomaly Detection Algorithms

1. **Z-Score Method**:
   - Calculates standard deviations from mean
   - Flags data points beyond threshold (default: 3σ)
   - Good for normally distributed data

2. **IQR Method**:
   - Uses interquartile range
   - Robust to extreme outliers
   - Flags points outside Q1 - 1.5×IQR to Q3 + 1.5×IQR

3. **Isolation Forest**:
   - Machine learning ensemble method
   - Isolates anomalies using random forests
   - Effective for multivariate data

4. **Bollinger Bands**:
   - Technical analysis indicator
   - Detects price breakouts
   - Uses 20-day moving average ± 2 standard deviations

5. **Combined Method**:
   - Runs multiple methods
   - Uses voting mechanism
   - Reduces false positives

### News Sources
- **NewsAPI** (with API key): Comprehensive news coverage from 80,000+ sources
- **Yahoo Finance RSS** (fallback): Free, no API key required

## Limitations

- **Historical data**: Limited to yfinance availability (typically max 5-10 years)
- **News coverage**: Free NewsAPI limited to 100 requests/day and articles from last 30 days
- **Real-time data**: 15-minute delay for stock prices (yfinance limitation)
- **Sentiment analysis**: Simple keyword-based (can be enhanced with NLP libraries)

## Future Enhancements

- [ ] Advanced sentiment analysis using NLP models
- [ ] Real-time monitoring and alerts
- [ ] Export functionality (PDF reports, CSV data)
- [ ] Comparison across multiple stocks
- [ ] Custom alert thresholds
- [ ] Social media sentiment integration
- [ ] Technical indicators customization
- [ ] Backtesting framework

## Troubleshooting

### Common Issues

**Issue**: "No data found for ticker"
- **Solution**: Verify ticker symbol is correct and has trading history

**Issue**: "NewsAPI rate limit exceeded"
- **Solution**: Wait 24 hours or use Yahoo Finance fallback (don't provide API key)

**Issue**: "App is slow"
- **Solution**: Reduce date range or analyze fewer tickers at once

**Issue**: "No anomalies detected"
- **Solution**: Adjust detection parameters (lower thresholds) or try different methods

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Support

For questions or issues:
1. Check the troubleshooting section
2. Review existing GitHub issues
3. Create a new issue with details

## Acknowledgments

- Built with [Streamlit](https://streamlit.io/)
- Stock data from [yfinance](https://github.com/ranaroussi/yfinance)
- News data from [NewsAPI](https://newsapi.org/) and Yahoo Finance
- Charts powered by [Plotly](https://plotly.com/)

---

**Happy Analyzing!** 📈📊📰
