"""
News Fetching Module
Fetches and matches news articles to stock anomalies
"""

import pandas as pd
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import streamlit as st


class NewsFetcher:
    """Fetches news articles and matches them to anomaly dates"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize news fetcher

        Args:
            api_key: NewsAPI key (optional - will use free tier if not provided)
        """
        self.api_key = api_key
        self.base_url = "https://newsapi.org/v2/everything"

    def fetch_news_for_date_range(
        self,
        ticker: str,
        company_name: str,
        start_date: datetime,
        end_date: datetime,
        window_days: int = 1
    ) -> List[Dict]:
        """
        Fetch news articles for a date range

        Args:
            ticker: Stock ticker symbol
            company_name: Company name for search
            start_date: Start date
            end_date: End date
            window_days: Days to look around each date

        Returns:
            List of news articles
        """
        articles = []

        # Search queries - use ticker and company name
        queries = [ticker]
        if company_name and company_name != ticker:
            # Extract main company name (before comma or parenthesis)
            main_name = company_name.split(',')[0].split('(')[0].strip()
            if main_name:
                queries.append(main_name)

        for query in queries:
            try:
                articles.extend(
                    self._fetch_news_from_api(query, start_date, end_date)
                )
            except Exception as e:
                st.warning(f"Could not fetch news for {query}: {str(e)}")

        # Remove duplicates based on title
        seen_titles = set()
        unique_articles = []
        for article in articles:
            title = article.get('title', '')
            if title and title not in seen_titles:
                seen_titles.add(title)
                unique_articles.append(article)

        # Sort by published date
        unique_articles.sort(
            key=lambda x: x.get('publishedAt', ''),
            reverse=True
        )

        return unique_articles

    def _fetch_news_from_api(
        self,
        query: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """Fetch news from NewsAPI"""

        # If no API key, return sample/cached data or use alternative source
        if not self.api_key:
            return self._fetch_news_alternative(query, start_date, end_date)

        try:
            params = {
                'q': query,
                'from': start_date.strftime('%Y-%m-%d'),
                'to': end_date.strftime('%Y-%m-%d'),
                'language': 'en',
                'sortBy': 'relevancy',
                'apiKey': self.api_key,
                'pageSize': 100
            }

            response = requests.get(self.base_url, params=params, timeout=10)

            if response.status_code == 200:
                data = response.json()
                return data.get('articles', [])
            elif response.status_code == 401:
                st.warning("Invalid NewsAPI key. Using alternative news source.")
                return self._fetch_news_alternative(query, start_date, end_date)
            else:
                st.warning(f"NewsAPI returned status code {response.status_code}")
                return self._fetch_news_alternative(query, start_date, end_date)

        except Exception as e:
            st.warning(f"Error fetching from NewsAPI: {str(e)}")
            return self._fetch_news_alternative(query, start_date, end_date)

    def _fetch_news_alternative(
        self,
        query: str,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict]:
        """
        Alternative news fetching method using Yahoo Finance RSS or web scraping
        This is a fallback when NewsAPI is not available
        """
        articles = []

        try:
            # Use Yahoo Finance news (free, no API key required)
            url = f"https://feeds.finance.yahoo.com/rss/2.0/headline?s={query}&region=US&lang=en-US"

            response = requests.get(url, timeout=10)

            if response.status_code == 200:
                from bs4 import BeautifulSoup

                soup = BeautifulSoup(response.content, 'xml')
                items = soup.find_all('item')

                for item in items[:20]:  # Limit to 20 articles
                    title = item.find('title')
                    link = item.find('link')
                    pub_date = item.find('pubDate')
                    description = item.find('description')

                    if title and link:
                        article = {
                            'title': title.text,
                            'url': link.text,
                            'description': description.text if description else '',
                            'publishedAt': pub_date.text if pub_date else '',
                            'source': {'name': 'Yahoo Finance'}
                        }
                        articles.append(article)

        except Exception as e:
            # If all else fails, return empty list
            pass

        return articles

    def match_news_to_anomalies(
        self,
        anomalies_df: pd.DataFrame,
        ticker: str,
        company_name: str,
        window_days: int = 1
    ) -> Dict[str, List[Dict]]:
        """
        Match news articles to anomaly dates

        Args:
            anomalies_df: DataFrame with anomalies
            ticker: Stock ticker
            company_name: Company name
            window_days: Days before/after anomaly to search for news

        Returns:
            Dictionary mapping anomaly dates to news articles
        """
        news_matches = {}

        anomaly_dates = anomalies_df[anomalies_df['is_anomaly']].index

        for date in anomaly_dates:
            # Search for news in a window around the anomaly
            start_date = date - timedelta(days=window_days)
            end_date = date + timedelta(days=window_days)

            articles = self.fetch_news_for_date_range(
                ticker=ticker,
                company_name=company_name,
                start_date=start_date,
                end_date=end_date,
                window_days=window_days
            )

            if articles:
                news_matches[date.strftime('%Y-%m-%d')] = articles

        return news_matches

    def analyze_news_sentiment(self, articles: List[Dict]) -> Dict:
        """
        Simple sentiment analysis based on keywords
        (Can be enhanced with NLP libraries)

        Args:
            articles: List of news articles

        Returns:
            Sentiment summary
        """
        positive_keywords = [
            'gain', 'rise', 'surge', 'profit', 'growth', 'beat',
            'exceed', 'strong', 'positive', 'upgrade', 'buy', 'success'
        ]
        negative_keywords = [
            'loss', 'fall', 'drop', 'decline', 'crash', 'miss',
            'cut', 'weak', 'negative', 'downgrade', 'sell', 'fail'
        ]

        positive_count = 0
        negative_count = 0
        neutral_count = 0

        for article in articles:
            text = (
                article.get('title', '') + ' ' +
                article.get('description', '')
            ).lower()

            pos_score = sum(1 for word in positive_keywords if word in text)
            neg_score = sum(1 for word in negative_keywords if word in text)

            if pos_score > neg_score:
                positive_count += 1
            elif neg_score > pos_score:
                negative_count += 1
            else:
                neutral_count += 1

        total = len(articles)
        if total == 0:
            return {
                'positive': 0,
                'negative': 0,
                'neutral': 0,
                'dominant': 'neutral'
            }

        sentiment = {
            'positive': positive_count / total * 100,
            'negative': negative_count / total * 100,
            'neutral': neutral_count / total * 100,
            'dominant': 'positive' if positive_count > negative_count else (
                'negative' if negative_count > positive_count else 'neutral'
            )
        }

        return sentiment
