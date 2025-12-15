/**
 * Stock Data Fetching Module
 * Handles fetching historical stock data using yahoo-finance2
 */

import yahooFinance from 'yahoo-finance2';
import { StockDataPoint, StockInfo } from './types';

export class StockDataFetcher {
  /**
   * Fetch historical stock data for a given ticker and date range
   */
  async fetchStockData(
    ticker: string,
    startDate: string,
    endDate: string
  ): Promise<StockDataPoint[]> {
    try {
      const result = await yahooFinance.historical(ticker, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      });

      if (!result || result.length === 0) {
        throw new Error(`No data found for ticker ${ticker}`);
      }

      // Convert to our data format
      const data: StockDataPoint[] = result.map((item) => ({
        date: item.date.toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
      }));

      // Calculate additional metrics
      return this.calculateMetrics(data);
    } catch (error) {
      throw new Error(`Error fetching data for ${ticker}: ${(error as Error).message}`);
    }
  }

  /**
   * Calculate technical indicators and metrics
   */
  private calculateMetrics(data: StockDataPoint[]): StockDataPoint[] {
    const result = [...data];

    for (let i = 0; i < result.length; i++) {
      const current = result[i];

      // Daily returns
      if (i > 0) {
        const previous = result[i - 1];
        current.returns = (current.close - previous.close) / previous.close;
        current.priceChange = current.close - previous.close;
        current.volumeChange = (current.volume - previous.volume) / previous.volume;
      }

      // Trading range
      current.range = current.high - current.low;
      current.rangePct = (current.range / current.close) * 100;

      // Moving averages
      if (i >= 4) {
        current.ma5 = this.calculateMA(result, i, 5);
      }
      if (i >= 19) {
        current.ma20 = this.calculateMA(result, i, 20);
      }
      if (i >= 49) {
        current.ma50 = this.calculateMA(result, i, 50);
      }

      // Volatility (20-day rolling std of returns)
      if (i >= 19) {
        current.volatility = this.calculateVolatility(result, i, 20);
      }

      // Bollinger Bands
      if (i >= 19) {
        const { middle, upper, lower } = this.calculateBollingerBands(result, i, 20);
        current.bbMiddle = middle;
        current.bbUpper = upper;
        current.bbLower = lower;
      }

      // RSI
      if (i >= 13) {
        current.rsi = this.calculateRSI(result, i, 14);
      }
    }

    return result;
  }

  /**
   * Calculate moving average
   */
  private calculateMA(data: StockDataPoint[], index: number, period: number): number {
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[index - i].close;
    }
    return sum / period;
  }

  /**
   * Calculate volatility (standard deviation of returns)
   */
  private calculateVolatility(data: StockDataPoint[], index: number, period: number): number {
    const returns: number[] = [];
    for (let i = 0; i < period; i++) {
      const ret = data[index - i].returns;
      if (ret !== undefined) {
        returns.push(ret);
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(
    data: StockDataPoint[],
    index: number,
    period: number
  ): { middle: number; upper: number; lower: number } {
    const prices: number[] = [];
    for (let i = 0; i < period; i++) {
      prices.push(data[index - i].close);
    }

    const middle = prices.reduce((a, b) => a + b, 0) / period;
    const variance = prices.reduce((a, b) => a + Math.pow(b - middle, 2), 0) / period;
    const std = Math.sqrt(variance);

    return {
      middle,
      upper: middle + 2 * std,
      lower: middle - 2 * std,
    };
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(data: StockDataPoint[], index: number, period: number): number {
    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i <= period; i++) {
      const change = data[index - period + i].priceChange || 0;
      if (change > 0) {
        gains.push(change);
        losses.push(0);
      } else {
        gains.push(0);
        losses.push(Math.abs(change));
      }
    }

    const avgGain = gains.reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  /**
   * Get basic stock information
   */
  async getStockInfo(ticker: string): Promise<StockInfo> {
    try {
      const quote = await yahooFinance.quoteSummary(ticker, {
        modules: ['price', 'summaryProfile'],
      });

      return {
        name: quote.price?.longName || ticker,
        sector: quote.summaryProfile?.sector || 'N/A',
        industry: quote.summaryProfile?.industry || 'N/A',
        marketCap: quote.price?.marketCap || 'N/A',
        currency: quote.price?.currency || 'USD',
      };
    } catch (error) {
      return {
        name: ticker,
        sector: 'N/A',
        industry: 'N/A',
        marketCap: 'N/A',
        currency: 'USD',
      };
    }
  }

  /**
   * Validate if a ticker exists
   */
  async validateTicker(ticker: string): Promise<boolean> {
    try {
      const result = await yahooFinance.historical(ticker, {
        period1: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        period2: new Date().toISOString().split('T')[0],
      });
      return result && result.length > 0;
    } catch {
      return false;
    }
  }
}
