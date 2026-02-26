"""
Live market data service for stock analysis.
Fetches real-time quote, historical candles, and related news from Yahoo Finance endpoints.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict, List

import httpx
import numpy as np
import yfinance as yf


class MarketDataError(Exception):
    pass


class MarketDataService:
    BASE_QUERY = "https://query1.finance.yahoo.com"
    BASE_QUERY2 = "https://query2.finance.yahoo.com"
    DEFAULT_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "application/json,text/plain,*/*",
    }

    @staticmethod
    def _normalize_ticker(ticker: str) -> str:
        t = (ticker or "").strip().upper()
        if not t:
            raise MarketDataError("Ticker is required")
        # Default to NSE if exchange suffix is missing.
        if "." not in t:
            t = f"{t}.NS"
        return t

    @staticmethod
    def _rsi(values: np.ndarray, period: int = 14) -> float | None:
        if len(values) < period + 1:
            return None
        deltas = np.diff(values)
        gains = np.where(deltas > 0, deltas, 0.0)
        losses = np.where(deltas < 0, -deltas, 0.0)
        avg_gain = np.mean(gains[-period:])
        avg_loss = np.mean(losses[-period:])
        if avg_loss == 0:
            return 100.0
        rs = avg_gain / avg_loss
        return float(100 - (100 / (1 + rs)))

    @staticmethod
    def _sma(values: np.ndarray, period: int) -> float | None:
        if len(values) < period:
            return None
        return float(np.mean(values[-period:]))

    async def _get_with_retry(
        self,
        client: httpx.AsyncClient,
        url: str,
        params: Dict[str, Any],
        max_retries: int = 2
    ) -> httpx.Response:
        last_resp = None
        for attempt in range(max_retries + 1):
            resp = await client.get(url, params=params)
            last_resp = resp
            if resp.status_code in (200, 404):
                return resp
            if resp.status_code == 429 and attempt < max_retries:
                await asyncio.sleep(1.25 * (attempt + 1))
                continue
            if 500 <= resp.status_code < 600 and attempt < max_retries:
                await asyncio.sleep(0.9 * (attempt + 1))
                continue
            return resp
        return last_resp

    async def fetch_live_context(self, ticker: str) -> Dict[str, Any]:
        symbol = self._normalize_ticker(ticker)
        timeout = httpx.Timeout(15.0, read=20.0)

        quote_url = f"{self.BASE_QUERY}/v7/finance/quote"
        chart_url = f"{self.BASE_QUERY}/v8/finance/chart/{symbol}"
        search_url = f"{self.BASE_QUERY}/v1/finance/search"
        quote_url_alt = f"{self.BASE_QUERY2}/v7/finance/quote"
        chart_url_alt = f"{self.BASE_QUERY2}/v8/finance/chart/{symbol}"
        search_url_alt = f"{self.BASE_QUERY2}/v1/finance/search"

        params_quote = {"symbols": symbol}
        params_chart = {"range": "6mo", "interval": "1d"}
        params_search = {"q": symbol, "quotesCount": 1, "newsCount": 8}

        try:
            async with httpx.AsyncClient(timeout=timeout, headers=self.DEFAULT_HEADERS) as client:
                quote_resp, chart_resp, search_resp = await asyncio.gather(
                    self._get_with_retry(client, quote_url, params_quote),
                    self._get_with_retry(client, chart_url, params_chart),
                    self._get_with_retry(client, search_url, params_search),
                )

                # Alternate Yahoo host fallback for throttled responses.
                if quote_resp.status_code == 429:
                    quote_resp = await self._get_with_retry(client, quote_url_alt, params_quote)
                if chart_resp.status_code == 429:
                    chart_resp = await self._get_with_retry(client, chart_url_alt, params_chart)
                if search_resp.status_code == 429:
                    search_resp = await self._get_with_retry(client, search_url_alt, params_search)
        except Exception:
            return await self._fetch_with_yfinance(symbol)

        # If direct Yahoo APIs are blocked/throttled, fallback to yfinance resolver.
        if quote_resp.status_code != 200 or chart_resp.status_code != 200:
            return await self._fetch_with_yfinance(symbol)
        if search_resp.status_code != 200:
            # Soft fail for news path; keep live price/series from quote+chart.
            search_json = {"news": []}
        else:
            search_json = search_resp.json()

        quote_json = quote_resp.json()
        chart_json = chart_resp.json()

        quote_results = (quote_json.get("quoteResponse") or {}).get("result") or []
        if not quote_results:
            raise MarketDataError("No live quote found for ticker")

        quote = quote_results[0]

        chart_result = ((chart_json.get("chart") or {}).get("result") or [None])[0]
        if not chart_result:
            raise MarketDataError("No chart data found for ticker")

        timestamps = chart_result.get("timestamp") or []
        quotes = ((chart_result.get("indicators") or {}).get("quote") or [None])[0] or {}
        closes = [c for c in (quotes.get("close") or []) if c is not None]

        if len(closes) < 20:
            raise MarketDataError("Insufficient live history data for analysis")

        close_arr = np.array(closes, dtype=float)
        rsi14 = self._rsi(close_arr, 14)
        sma20 = self._sma(close_arr, 20)
        sma50 = self._sma(close_arr, 50)

        price_series: List[Dict[str, Any]] = []
        ts_clean = [int(t) for t in timestamps if isinstance(t, (int, float))]
        for i, close_val in enumerate(closes[-20:]):
            # Align with last timestamps where available.
            ts = ts_clean[-20 + i] if len(ts_clean) >= 20 else None
            price_series.append({"ts": ts, "close": float(close_val)})

        news_items = []
        for n in (search_json.get("news") or [])[:6]:
            news_items.append(
                {
                    "title": n.get("title"),
                    "publisher": n.get("publisher"),
                    "link": n.get("link"),
                    "published_at_epoch": n.get("providerPublishTime"),
                }
            )

        return {
            "symbol": symbol,
            "fetched_at_epoch": int(time.time()),
            "quote": {
                "shortName": quote.get("shortName"),
                "longName": quote.get("longName"),
                "currency": quote.get("currency"),
                "exchange": quote.get("fullExchangeName"),
                "regularMarketPrice": quote.get("regularMarketPrice"),
                "regularMarketChangePercent": quote.get("regularMarketChangePercent"),
                "regularMarketVolume": quote.get("regularMarketVolume"),
                "marketCap": quote.get("marketCap"),
                "trailingPE": quote.get("trailingPE"),
                "epsTrailingTwelveMonths": quote.get("epsTrailingTwelveMonths"),
            },
            "technical": {
                "rsi14": rsi14,
                "sma20": sma20,
                "sma50": sma50,
            },
            "series": price_series,
            "news": news_items,
        }

    async def _fetch_with_yfinance(self, symbol: str) -> Dict[str, Any]:
        def _load() -> Dict[str, Any]:
            tk = yf.Ticker(symbol)
            info = tk.info or {}
            hist = tk.history(period="6mo", interval="1d", auto_adjust=False)
            if hist is None or hist.empty:
                raise MarketDataError("No live history data from yfinance")

            closes = [float(v) for v in hist["Close"].dropna().tolist()]
            if len(closes) < 20:
                raise MarketDataError("Insufficient live history data from yfinance")

            close_arr = np.array(closes, dtype=float)
            rsi14 = self._rsi(close_arr, 14)
            sma20 = self._sma(close_arr, 20)
            sma50 = self._sma(close_arr, 50)

            series = []
            tail = hist.tail(20)
            for idx, row in tail.iterrows():
                ts = int(idx.timestamp()) if hasattr(idx, "timestamp") else None
                close_val = row.get("Close")
                if close_val is None:
                    continue
                series.append({"ts": ts, "close": float(close_val)})

            return {
                "symbol": symbol,
                "fetched_at_epoch": int(time.time()),
                "quote": {
                    "shortName": info.get("shortName"),
                    "longName": info.get("longName"),
                    "currency": info.get("currency"),
                    "exchange": info.get("fullExchangeName") or info.get("exchange"),
                    "regularMarketPrice": info.get("regularMarketPrice"),
                    "regularMarketChangePercent": info.get("regularMarketChangePercent"),
                    "regularMarketVolume": info.get("regularMarketVolume"),
                    "marketCap": info.get("marketCap"),
                    "trailingPE": info.get("trailingPE"),
                    "epsTrailingTwelveMonths": info.get("trailingEps"),
                },
                "technical": {
                    "rsi14": rsi14,
                    "sma20": sma20,
                    "sma50": sma50,
                },
                "series": series,
                "news": [],
            }

        try:
            return await asyncio.to_thread(_load)
        except Exception as e:
            raise MarketDataError(f"yfinance fallback failed: {e}")


market_data_service = MarketDataService()
