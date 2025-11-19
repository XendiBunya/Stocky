"""
Stock Anomaly Detection and News Correlation App
A Streamlit application for detecting stock price anomalies and matching them with news events
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import sys
import os

# Add modules directory to path
sys.path.append(os.path.dirname(__file__))

from modules.stock_data import StockDataFetcher
from modules.anomaly_detector import AnomalyDetector
from modules.news_fetcher import NewsFetcher


# Page configuration
st.set_page_config(
    page_title="Stock Anomaly Detector",
    page_icon="📈",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
    <style>
    .main {
        padding: 0rem 1rem;
    }
    .stAlert {
        margin-top: 1rem;
    }
    h1 {
        color: #1f77b4;
        padding-bottom: 1rem;
    }
    h2 {
        color: #2ca02c;
        padding-top: 1rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        margin: 0.5rem 0;
    }
    </style>
    """, unsafe_allow_html=True)


def main():
    """Main application function"""

    # Title and description
    st.title("📈 Stock Anomaly Detection & News Correlation")
    st.markdown("""
    This application analyzes stock price data to detect anomalies and correlates them with news events.
    Use the sidebar to configure your analysis parameters.
    """)

    # Sidebar configuration
    st.sidebar.header("⚙️ Configuration")

    # Stock selection
    st.sidebar.subheader("Stock Selection")
    ticker_input = st.sidebar.text_input(
        "Enter Stock Ticker(s)",
        value="AAPL",
        help="Enter one or more stock tickers separated by commas (e.g., AAPL, MSFT, GOOGL)"
    )
    tickers = [t.strip().upper() for t in ticker_input.split(',')]

    # Date range selection
    st.sidebar.subheader("Date Range")
    date_range_type = st.sidebar.radio(
        "Select date range type:",
        ["Preset", "Custom"],
        help="Choose a preset range or specify custom dates"
    )

    if date_range_type == "Preset":
        preset = st.sidebar.selectbox(
            "Select preset range:",
            ["Last 30 Days", "Last 3 Months", "Last 6 Months", "Last Year", "Last 2 Years"]
        )
        preset_days = {
            "Last 30 Days": 30,
            "Last 3 Months": 90,
            "Last 6 Months": 180,
            "Last Year": 365,
            "Last 2 Years": 730
        }
        end_date = datetime.now()
        start_date = end_date - timedelta(days=preset_days[preset])
    else:
        col1, col2 = st.sidebar.columns(2)
        with col1:
            start_date = st.date_input(
                "Start Date",
                value=datetime.now() - timedelta(days=365),
                max_value=datetime.now()
            )
        with col2:
            end_date = st.date_input(
                "End Date",
                value=datetime.now(),
                max_value=datetime.now()
            )
        start_date = datetime.combine(start_date, datetime.min.time())
        end_date = datetime.combine(end_date, datetime.min.time())

    # Anomaly detection configuration
    st.sidebar.subheader("Anomaly Detection")
    detection_method = st.sidebar.selectbox(
        "Detection Method",
        ["Z-Score", "IQR", "Isolation Forest", "Bollinger Bands", "Combined"],
        help="Select the anomaly detection algorithm"
    )

    # Method-specific parameters
    params = {}
    if detection_method == "Z-Score":
        params['z_threshold'] = st.sidebar.slider(
            "Z-Score Threshold",
            min_value=1.0,
            max_value=5.0,
            value=3.0,
            step=0.1,
            help="Higher values = fewer anomalies"
        )
    elif detection_method == "IQR":
        params['iqr_multiplier'] = st.sidebar.slider(
            "IQR Multiplier",
            min_value=1.0,
            max_value=3.0,
            value=1.5,
            step=0.1,
            help="Higher values = fewer anomalies"
        )
    elif detection_method == "Isolation Forest":
        params['contamination'] = st.sidebar.slider(
            "Contamination",
            min_value=0.01,
            max_value=0.3,
            value=0.1,
            step=0.01,
            help="Expected proportion of anomalies"
        )
        params['n_estimators'] = st.sidebar.slider(
            "Number of Estimators",
            min_value=50,
            max_value=200,
            value=100,
            step=10
        )
    elif detection_method == "Combined":
        params['voting_threshold'] = st.sidebar.slider(
            "Voting Threshold",
            min_value=1,
            max_value=3,
            value=2,
            step=1,
            help="Number of methods that must agree"
        )

    # Features to analyze
    st.sidebar.subheader("Features to Analyze")
    available_features = [
        'Returns', 'Volume_Change', 'Range_Pct', 'Volatility'
    ]
    selected_features = st.sidebar.multiselect(
        "Select features for anomaly detection:",
        available_features,
        default=['Returns', 'Volume_Change'],
        help="Features used to detect anomalies"
    )

    # News configuration
    st.sidebar.subheader("News Correlation")
    enable_news = st.sidebar.checkbox(
        "Enable News Correlation",
        value=True,
        help="Match anomalies with news articles"
    )

    news_api_key = None
    news_window = 1

    if enable_news:
        news_api_key = st.sidebar.text_input(
            "NewsAPI Key (Optional)",
            type="password",
            help="Get your free API key from newsapi.org. Leave empty to use Yahoo Finance."
        )
        news_window = st.sidebar.slider(
            "News Search Window (days)",
            min_value=0,
            max_value=7,
            value=1,
            help="Days before/after anomaly to search for news"
        )

    # Run analysis button
    run_analysis = st.sidebar.button("🚀 Run Analysis", type="primary", use_container_width=True)

    # Main content area
    if run_analysis:
        if not selected_features:
            st.error("Please select at least one feature for anomaly detection.")
            return

        # Process each ticker
        for ticker in tickers:
            st.header(f"Analysis for {ticker}")

            # Initialize components
            stock_fetcher = StockDataFetcher()

            # Validate ticker
            with st.spinner(f"Validating ticker {ticker}..."):
                if not stock_fetcher.validate_ticker(ticker):
                    st.error(f"Invalid ticker: {ticker}. Please check and try again.")
                    continue

            # Fetch stock info
            stock_info = stock_fetcher.get_stock_info(ticker)

            # Display stock info
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Company", stock_info['name'])
            with col2:
                st.metric("Sector", stock_info['sector'])
            with col3:
                st.metric("Industry", stock_info['industry'])
            with col4:
                market_cap = stock_info['market_cap']
                if isinstance(market_cap, (int, float)):
                    market_cap_str = f"${market_cap/1e9:.2f}B"
                else:
                    market_cap_str = str(market_cap)
                st.metric("Market Cap", market_cap_str)

            # Fetch stock data
            with st.spinner(f"Fetching stock data for {ticker}..."):
                df = stock_fetcher.fetch_stock_data(
                    ticker,
                    start_date.strftime('%Y-%m-%d'),
                    end_date.strftime('%Y-%m-%d')
                )

            if df.empty:
                st.error(f"No data available for {ticker} in the selected date range.")
                continue

            st.success(f"Fetched {len(df)} trading days of data")

            # Detect anomalies
            with st.spinner("Detecting anomalies..."):
                method_map = {
                    "Z-Score": "z_score",
                    "IQR": "iqr",
                    "Isolation Forest": "isolation_forest",
                    "Bollinger Bands": "bollinger",
                    "Combined": "combined"
                }

                detector = AnomalyDetector(
                    method=method_map[detection_method],
                    **params
                )

                df_with_anomalies = detector.detect_anomalies(df, selected_features)
                anomaly_summary = detector.get_anomaly_summary(df_with_anomalies)
                top_anomalies = detector.get_top_anomalies(df_with_anomalies, n=10)

            # Display anomaly summary
            st.subheader("📊 Anomaly Summary")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric(
                    "Total Anomalies Detected",
                    anomaly_summary['total_anomalies']
                )
            with col2:
                st.metric(
                    "Anomaly Rate",
                    f"{anomaly_summary['anomaly_rate']:.2f}%"
                )
            with col3:
                st.metric(
                    "Max Anomaly Score",
                    f"{anomaly_summary['max_anomaly_score']:.2f}"
                )

            # Visualizations
            st.subheader("📈 Price Chart with Anomalies")

            # Create interactive plot
            fig = make_subplots(
                rows=3, cols=1,
                shared_xaxes=True,
                vertical_spacing=0.05,
                subplot_titles=('Price & Anomalies', 'Volume', 'Anomaly Score'),
                row_heights=[0.5, 0.25, 0.25]
            )

            # Price chart
            fig.add_trace(
                go.Scatter(
                    x=df_with_anomalies.index,
                    y=df_with_anomalies['Close'],
                    name='Close Price',
                    line=dict(color='blue', width=1)
                ),
                row=1, col=1
            )

            # Bollinger Bands if available
            if 'BB_Upper' in df_with_anomalies.columns:
                fig.add_trace(
                    go.Scatter(
                        x=df_with_anomalies.index,
                        y=df_with_anomalies['BB_Upper'],
                        name='BB Upper',
                        line=dict(color='gray', width=1, dash='dash'),
                        opacity=0.5
                    ),
                    row=1, col=1
                )
                fig.add_trace(
                    go.Scatter(
                        x=df_with_anomalies.index,
                        y=df_with_anomalies['BB_Lower'],
                        name='BB Lower',
                        line=dict(color='gray', width=1, dash='dash'),
                        opacity=0.5,
                        fill='tonexty'
                    ),
                    row=1, col=1
                )

            # Mark anomalies
            anomalies = df_with_anomalies[df_with_anomalies['is_anomaly']]
            fig.add_trace(
                go.Scatter(
                    x=anomalies.index,
                    y=anomalies['Close'],
                    mode='markers',
                    name='Anomalies',
                    marker=dict(
                        color='red',
                        size=10,
                        symbol='circle',
                        line=dict(color='darkred', width=2)
                    )
                ),
                row=1, col=1
            )

            # Volume
            fig.add_trace(
                go.Bar(
                    x=df_with_anomalies.index,
                    y=df_with_anomalies['Volume'],
                    name='Volume',
                    marker_color='lightblue'
                ),
                row=2, col=1
            )

            # Anomaly score
            fig.add_trace(
                go.Scatter(
                    x=df_with_anomalies.index,
                    y=df_with_anomalies['anomaly_score'],
                    name='Anomaly Score',
                    fill='tozeroy',
                    line=dict(color='orange')
                ),
                row=3, col=1
            )

            # Update layout
            fig.update_layout(
                height=800,
                showlegend=True,
                hovermode='x unified',
                title_text=f"{ticker} Stock Analysis"
            )

            fig.update_xaxes(title_text="Date", row=3, col=1)
            fig.update_yaxes(title_text="Price ($)", row=1, col=1)
            fig.update_yaxes(title_text="Volume", row=2, col=1)
            fig.update_yaxes(title_text="Score", row=3, col=1)

            st.plotly_chart(fig, use_container_width=True)

            # Top anomalies table
            if not top_anomalies.empty:
                st.subheader("🔍 Top Anomalies")

                display_cols = ['Close', 'Returns', 'Volume', 'anomaly_score', 'anomaly_reasons']
                display_cols = [col for col in display_cols if col in top_anomalies.columns]

                display_df = top_anomalies[display_cols].copy()
                display_df.index = display_df.index.strftime('%Y-%m-%d')

                # Format numeric columns
                if 'Close' in display_df.columns:
                    display_df['Close'] = display_df['Close'].apply(lambda x: f"${x:.2f}")
                if 'Returns' in display_df.columns:
                    display_df['Returns'] = display_df['Returns'].apply(lambda x: f"{x*100:.2f}%")
                if 'anomaly_score' in display_df.columns:
                    display_df['anomaly_score'] = display_df['anomaly_score'].apply(lambda x: f"{x:.2f}")

                st.dataframe(display_df, use_container_width=True)

            # News correlation
            if enable_news and anomaly_summary['total_anomalies'] > 0:
                st.subheader("📰 News Correlation")

                with st.spinner("Fetching news articles..."):
                    news_fetcher = NewsFetcher(api_key=news_api_key if news_api_key else None)

                    news_matches = news_fetcher.match_news_to_anomalies(
                        df_with_anomalies,
                        ticker,
                        stock_info['name'],
                        window_days=news_window
                    )

                if news_matches:
                    st.success(f"Found news for {len(news_matches)} anomaly dates")

                    # Display news for each anomaly
                    for date_str, articles in news_matches.items():
                        with st.expander(f"📅 {date_str} ({len(articles)} articles)"):
                            # Get anomaly details
                            anomaly_date = pd.to_datetime(date_str)
                            if anomaly_date in df_with_anomalies.index:
                                anomaly_row = df_with_anomalies.loc[anomaly_date]

                                col1, col2, col3 = st.columns(3)
                                with col1:
                                    st.metric("Close Price", f"${anomaly_row['Close']:.2f}")
                                with col2:
                                    st.metric(
                                        "Return",
                                        f"{anomaly_row['Returns']*100:.2f}%"
                                        if 'Returns' in anomaly_row else "N/A"
                                    )
                                with col3:
                                    st.metric("Anomaly Score", f"{anomaly_row['anomaly_score']:.2f}")

                            # Sentiment analysis
                            sentiment = news_fetcher.analyze_news_sentiment(articles)
                            st.write(f"**Sentiment:** {sentiment['dominant'].title()} "
                                   f"(Positive: {sentiment['positive']:.1f}%, "
                                   f"Negative: {sentiment['negative']:.1f}%, "
                                   f"Neutral: {sentiment['neutral']:.1f}%)")

                            # Display articles
                            for i, article in enumerate(articles[:5], 1):  # Limit to 5 articles
                                st.markdown(f"""
                                **{i}. {article.get('title', 'No title')}**
                                *{article.get('source', {}).get('name', 'Unknown source')} - {article.get('publishedAt', 'Unknown date')}*
                                {article.get('description', 'No description available')}
                                [Read more]({article.get('url', '#')})
                                """)
                                st.divider()
                else:
                    st.info("No news articles found for the detected anomalies.")

            st.divider()

    else:
        # Landing page
        st.info("👈 Configure your analysis parameters in the sidebar and click 'Run Analysis' to begin.")

        # Features overview
        st.subheader("Features")
        col1, col2, col3 = st.columns(3)

        with col1:
            st.markdown("""
            **📊 Multiple Detection Methods**
            - Z-Score
            - IQR (Interquartile Range)
            - Isolation Forest
            - Bollinger Bands
            - Combined Voting
            """)

        with col2:
            st.markdown("""
            **📈 Historical Analysis**
            - Custom date ranges
            - Multiple stock tickers
            - Comprehensive metrics
            - Interactive visualizations
            """)

        with col3:
            st.markdown("""
            **📰 News Correlation**
            - Automatic news matching
            - Sentiment analysis
            - Multiple news sources
            - Contextual insights
            """)

        # Example usage
        st.subheader("Example Usage")
        st.markdown("""
        1. Enter a stock ticker (e.g., AAPL, MSFT, GOOGL)
        2. Select a date range for historical analysis
        3. Choose an anomaly detection method and tune parameters
        4. Optionally add a NewsAPI key for enhanced news correlation
        5. Click 'Run Analysis' to see results
        """)


if __name__ == "__main__":
    main()
