"""
Stock Data Fetching Module
Handles fetching historical and real-time stock data using yfinance
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import streamlit as st


class StockDataFetcher:
    """Fetches and processes stock data"""

    def __init__(self):
        self.cache = {}

    @st.cache_data(ttl=3600)
    def fetch_stock_data(_self, ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
        """
        Fetch historical stock data for a given ticker and date range

        Args:
            ticker: Stock ticker symbol (e.g., 'AAPL')
            start_date: Start date in 'YYYY-MM-DD' format
            end_date: End date in 'YYYY-MM-DD' format

        Returns:
            DataFrame with stock data including OHLCV and additional metrics
        """
        try:
            stock = yf.Ticker(ticker)
            df = stock.history(start=start_date, end=end_date)

            if df.empty:
                raise ValueError(f"No data found for ticker {ticker}")

            # Calculate additional metrics
            df = _self._calculate_metrics(df)

            return df

        except Exception as e:
            st.error(f"Error fetching data for {ticker}: {str(e)}")
            return pd.DataFrame()

    def _calculate_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate additional technical metrics"""
        # Daily returns
        df['Returns'] = df['Close'].pct_change()

        # Price change
        df['Price_Change'] = df['Close'].diff()

        # Volume change
        df['Volume_Change'] = df['Volume'].pct_change()

        # Trading range
        df['Range'] = df['High'] - df['Low']

        # Range percentage
        df['Range_Pct'] = (df['Range'] / df['Close']) * 100

        # Moving averages
        df['MA_5'] = df['Close'].rolling(window=5).mean()
        df['MA_20'] = df['Close'].rolling(window=20).mean()
        df['MA_50'] = df['Close'].rolling(window=50).mean()

        # Volatility (20-day rolling std of returns)
        df['Volatility'] = df['Returns'].rolling(window=20).std()

        # Bollinger Bands
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)

        # RSI (Relative Strength Index)
        df['RSI'] = self._calculate_rsi(df['Close'])

        return df

    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate Relative Strength Index"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))

        return rsi

    def get_stock_info(self, ticker: str) -> dict:
        """Get basic stock information"""
        try:
            stock = yf.Ticker(ticker)
            info = stock.info

            return {
                'name': info.get('longName', ticker),
                'sector': info.get('sector', 'N/A'),
                'industry': info.get('industry', 'N/A'),
                'market_cap': info.get('marketCap', 'N/A'),
                'currency': info.get('currency', 'USD')
            }
        except Exception as e:
            return {
                'name': ticker,
                'sector': 'N/A',
                'industry': 'N/A',
                'market_cap': 'N/A',
                'currency': 'USD'
            }

    def validate_ticker(self, ticker: str) -> bool:
        """Validate if a ticker exists"""
        try:
            stock = yf.Ticker(ticker)
            # Try to get some recent data
            hist = stock.history(period="5d")
            return not hist.empty
        except:
            return False
