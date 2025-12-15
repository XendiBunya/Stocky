/**
 * News Fetching Module
 * Fetches and matches news articles to stock anomalies
 */

import axios from 'axios';
import { NewsArticle, NewsMatch, SentimentAnalysis } from './types';

export class NewsFetcher {
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch news articles for a date range
   */
  async fetchNewsForDateRange(
    ticker: string,
    companyName: string,
    startDate: string,
    endDate: string
  ): Promise<NewsArticle[]> {
    const queries = [ticker];

    if (companyName && companyName !== ticker) {
      const mainName = companyName.split(',')[0].split('(')[0].trim();
      if (mainName) {
        queries.push(mainName);
      }
    }

    const allArticles: NewsArticle[] = [];

    for (const query of queries) {
      try {
        const articles = await this.fetchNewsFromAPI(query, startDate, endDate);
        allArticles.push(...articles);
      } catch (error) {
        console.error(`Error fetching news for ${query}:`, error);
      }
    }

    // Remove duplicates based on title
    const seenTitles = new Set<string>();
    const uniqueArticles: NewsArticle[] = [];

    for (const article of allArticles) {
      if (article.title && !seenTitles.has(article.title)) {
        seenTitles.add(article.title);
        uniqueArticles.push(article);
      }
    }

    // Sort by published date
    uniqueArticles.sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return uniqueArticles;
  }

  /**
   * Fetch news from NewsAPI or fallback source
   */
  private async fetchNewsFromAPI(
    query: string,
    startDate: string,
    endDate: string
  ): Promise<NewsArticle[]> {
    if (this.apiKey) {
      try {
        return await this.fetchFromNewsAPI(query, startDate, endDate);
      } catch (error) {
        console.warn('NewsAPI failed, using fallback:', error);
        return await this.fetchAlternative(query);
      }
    } else {
      return await this.fetchAlternative(query);
    }
  }

  /**
   * Fetch from NewsAPI
   */
  private async fetchFromNewsAPI(
    query: string,
    startDate: string,
    endDate: string
  ): Promise<NewsArticle[]> {
    const url = 'https://newsapi.org/v2/everything';

    const response = await axios.get(url, {
      params: {
        q: query,
        from: startDate,
        to: endDate,
        language: 'en',
        sortBy: 'relevancy',
        apiKey: this.apiKey,
        pageSize: 100,
      },
      timeout: 10000,
    });

    if (response.status === 200 && response.data.articles) {
      return response.data.articles.map((article: any) => ({
        title: article.title,
        url: article.url,
        description: article.description || '',
        publishedAt: article.publishedAt,
        source: {
          name: article.source?.name || 'Unknown',
        },
      }));
    }

    return [];
  }

  /**
   * Alternative news fetching (Yahoo Finance RSS)
   */
  private async fetchAlternative(query: string): Promise<NewsArticle[]> {
    try {
      // In a real implementation, you would fetch from Yahoo Finance RSS
      // For now, return a placeholder that indicates news is available
      // but requires API key for full access

      // This could be enhanced to actually fetch from Yahoo Finance RSS feed
      // using an RSS parser library

      return [];
    } catch (error) {
      console.error('Alternative news fetch failed:', error);
      return [];
    }
  }

  /**
   * Match news articles to anomaly dates
   */
  async matchNewsToAnomalies(
    anomalyDates: string[],
    ticker: string,
    companyName: string,
    windowDays: number = 1
  ): Promise<NewsMatch> {
    const newsMatches: NewsMatch = {};

    for (const dateStr of anomalyDates) {
      const date = new Date(dateStr);
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - windowDays);

      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + windowDays);

      const articles = await this.fetchNewsForDateRange(
        ticker,
        companyName,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (articles.length > 0) {
        newsMatches[dateStr] = articles;
      }
    }

    return newsMatches;
  }

  /**
   * Simple sentiment analysis based on keywords
   */
  analyzeSentiment(articles: NewsArticle[]): SentimentAnalysis {
    const positiveKeywords = [
      'gain', 'rise', 'surge', 'profit', 'growth', 'beat',
      'exceed', 'strong', 'positive', 'upgrade', 'buy', 'success',
    ];

    const negativeKeywords = [
      'loss', 'fall', 'drop', 'decline', 'crash', 'miss',
      'cut', 'weak', 'negative', 'downgrade', 'sell', 'fail',
    ];

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const article of articles) {
      const text = `${article.title} ${article.description}`.toLowerCase();

      const posScore = positiveKeywords.filter((word) => text.includes(word)).length;
      const negScore = negativeKeywords.filter((word) => text.includes(word)).length;

      if (posScore > negScore) {
        positiveCount++;
      } else if (negScore > posScore) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }

    const total = articles.length;
    if (total === 0) {
      return {
        positive: 0,
        negative: 0,
        neutral: 0,
        dominant: 'neutral',
      };
    }

    return {
      positive: (positiveCount / total) * 100,
      negative: (negativeCount / total) * 100,
      neutral: (neutralCount / total) * 100,
      dominant:
        positiveCount > negativeCount
          ? 'positive'
          : negativeCount > positiveCount
          ? 'negative'
          : 'neutral',
    };
  }
}
