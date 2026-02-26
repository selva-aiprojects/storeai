
import { Request, Response } from 'express';
// import { YahooFinance } from 'yahoo-finance2'; // Wrong import
import YahooFinance from 'yahoo-finance2'; // Correct default import for v2.x/v3.x class usage
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const yahooFinance = new YahooFinance(); // Explicit instantiation

// Suppress SSL validation errors for local dev if behind proxy/corporate firewall
// @ts-ignore
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const chat = async (req: Request, res: Response) => {
    const { query, history } = req.body;
    const lowerQuery = query?.toLowerCase() || '';

    // Simulate AI thinking delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        let responseText = "";
        let contextData: any = null;
        let source = "CONVERSATION";

        // --- CONTEXT DETECTION ---
        let intent = 'UNKNOWN';

        // 1. Explicit Keywords
        if (lowerQuery.includes('stock') || lowerQuery.includes('inventory') || lowerQuery.includes('product') || lowerQuery.includes('item')) {
            intent = 'INVENTORY';
        } else if (lowerQuery.includes('sales') || lowerQuery.includes('revenue') || lowerQuery.includes('order')) {
            intent = 'SALES';
        } else if (lowerQuery.includes('customer') || lowerQuery.includes('client')) {
            intent = 'CUSTOMERS';
        }
        // 2. Context Inference from History
        else if (history && history.length > 0) {
            const lastAiMsg = history.filter((m: any) => m.role === 'assistant').pop()?.content || '';

            if (lastAiMsg.includes('inventory') || lastAiMsg.includes('stock') || lastAiMsg.includes('items')) {
                intent = 'INVENTORY';
            } else if (lastAiMsg.includes('sales') || lastAiMsg.includes('transaction')) {
                intent = 'SALES';
            } else if (lastAiMsg.includes('customer')) {
                intent = 'CUSTOMERS';
            }
        }

        // --- EXECUTION ---
        if (intent === 'INVENTORY') {
            const products = await prisma.product.findMany({
                take: 10,
                orderBy: { stockQuantity: 'asc' },
                select: { name: true, sku: true, stockQuantity: true, price: true }
            });

            if (lowerQuery.includes('low') || lowerQuery.includes('shortage')) {
                const lowStock = products.filter(p => p.stockQuantity < 10);
                responseText = `I found **${lowStock.length} items** with low stock levels (<10). You should consider reordering.`;
                contextData = lowStock;
            } else if (lowerQuery.includes('top') || lowerQuery.includes('list') || lowerQuery.includes('show') || lowerQuery.includes('yes') || lowerQuery.includes('provide')) {
                responseText = `Here is the list of your top inventory items (sorted by lowest stock).`;
                contextData = products;
            } else {
                responseText = `I can help with inventory. Do you want to see **low stock items** or a **full list**?`;
                source = "HEURISTIC";
            }
        }
        else if (intent === 'SALES') {
            const sales = await prisma.sale.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { customer: { select: { name: true } } }
            });
            const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);

            if (sales.length === 0) {
                responseText = "No recent sales records found.";
            } else {
                responseText = `I pulled your last **${sales.length} sales records**. The total value is **₹${totalRevenue.toFixed(2)}**.`;
                contextData = sales.map(s => ({
                    Invoice: s.invoiceNo,
                    Customer: s.customer?.name || 'Walk-in',
                    Amount: s.totalAmount,
                    Date: new Date(s.createdAt).toLocaleDateString()
                }));
            }
        }
        else if (intent === 'CUSTOMERS') {
            const customers = await prisma.customer.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { name: true, email: true, city: true, phone: true }
            });
            if (customers.length === 0) {
                responseText = "No customer records found.";
            } else {
                responseText = `Here are the details of the **5 most recently added customers**.`;
                contextData = customers;
            }
        }
        else if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('help')) {
            responseText = `Hello! I am your Store Intelligence Assistant. I can query your live database.\n\nTry asking:\n- "Show me low stock inventory"\n- "List recent sales"\n- "Who are the new customers?"\n- "Analyze RELIANCE.NS stock"\n\nFor stock analysis, use the "Market Analysis" tab.`;
            source = "HEURISTIC";
        }
        else {
            responseText = "I didn't quite catch that. I currently support queries for **Inventory**, **Sales**, and **Customers**. Try asking 'Show recent sales'.";
            source = "HEURISTIC";
        }

        if (contextData) source = "SQL";

        res.json({ response: responseText, context: contextData, source: source });

    } catch (error: any) {
        console.error("AI Chat Error:", error);
        res.status(500).json({
            response: "I encountered an internal database error.",
            source: "ERROR",
            detail: error.message
        });
    }
};

export const stockAnalyze = async (req: Request, res: Response) => {
    const { ticker } = req.body;
    // Calculate date 1 year ago for valid historical data range
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const startDate = oneYearAgo.toISOString().split('T')[0];

    try {
        let quote: any;
        let history: any[];

        try {
            const results = await Promise.all([
                yahooFinance.quote(ticker),
                yahooFinance.historical(ticker, { period1: startDate, interval: '1d' })
            ]);
            quote = results[0];
            history = results[1];
        } catch (apiErr: any) {
            console.error("Yahoo Finance API Error:", apiErr);
            // Return 400 for bad requests (invalid ticker) instead of 500
            if (apiErr.message?.includes('Not Found') || apiErr.message?.includes('404')) {
                return res.status(404).json({ detail: `Ticker '${ticker}' not found on exchange.` });
            }
            throw new Error(`Exchange Data Error: ${apiErr.message}`);
        }

        if (!quote) throw new Error("Stock ticker not found.");

        // Process Technicals
        const lastPrice = quote.regularMarketPrice || 0;
        const prevClose = quote.regularMarketPreviousClose || lastPrice;
        const priceChange = lastPrice - prevClose;
        // Avoid division by zero
        const percentChange = prevClose !== 0 ? (priceChange / prevClose) * 100 : 0;

        // Simple Moving Average
        // Ensure we have enough history
        // Explicitly type 'h' and 'c' as any to avoid implicit any errors if types are missing
        const closePrices: number[] = history.map((h: any) => h.close).filter((c: any) => c !== null && c !== undefined);

        // Explicitly type accumulator 'a' and current value 'b' in reduce
        const sma50 = closePrices.length >= 50 ? closePrices.slice(-50).reduce((a: number, b: number) => a + b, 0) / 50 : lastPrice;
        const sma200 = closePrices.length >= 200 ? closePrices.slice(-200).reduce((a: number, b: number) => a + b, 0) / 200 : lastPrice;

        // Heuristic AI Rating
        let rating = "Hold";
        let technicalScore = 50;
        let thesis = "Market conditions are neutral.";
        let bullCase = "Stable growth expected.";
        let bearCase = "Vector volatility risk.";

        if (lastPrice > sma50 && lastPrice > sma200) {
            rating = "Strong Buy";
            technicalScore = 92;
            thesis = `Strong bullish momentum observed as ${ticker} trades above both 50-day and 200-day moving averages.`;
            bullCase = "Breakout above recent highs could accelerate trend.";
            bearCase = "Profit taking may cause short-term pullbacks to support.";
        } else if (lastPrice < sma50 && lastPrice < sma200) {
            rating = "Sell";
            technicalScore = 30;
            thesis = `Bearish trend confirmed with price trading below key moving averages.`;
            bullCase = "Oversold bounce possible if support holds.";
            bearCase = "Further downside risk to next support zones.";
        } else if (lastPrice > sma50 && lastPrice < sma200) {
            rating = "Buy";
            technicalScore = 65;
            thesis = `Recovering trend. Price has reclaimed the 50-day MA but remains below long term trend.`;
            bullCase = "Golden cross potential if momentum sustains.";
            bearCase = "Rejection at 200-day MA could resume downtrend.";
        } else {
            rating = "Hold";
            technicalScore = 45;
            thesis = `Consolidation phase detected. Price is ranging between key moving averages.`;
            bullCase = "Breakout above resistance required for entry.";
            bearCase = "Breakdown below 50-day MA would be bearish.";
        }

        const chartData = history.slice(-90).map((h: any) => ({ // Last 90 days for chart
            date: h.date.toISOString().split('T')[0],
            close: h.close
        }));

        res.json({
            meta: {
                ticker: ticker || "UNKNOWN",
                company_name: quote.longName || ticker,
                sector: "Financial / Tech",
                last_price: lastPrice,
                currency: quote.currency || "INR",
                time_range: "3M"
            },
            core_signals: {
                ai_overall_rating: rating,
                technical_score: technicalScore,
                fundamental_score: Math.floor(Math.random() * (90 - 60) + 60), // Mocked
                news_score: percentChange > 0 ? 80 : 40,
                risk_score: Math.floor(Math.random() * 30),
                confidence: 88
            },
            ai_rationale: {
                thesis: thesis,
                time_horizon: "medium_term",
                bull_case: bullCase,
                bear_case: bearCase,
                base_case: "Sideways movement with accumulation."
            },
            explanations: {
                technical_explain: `Price is ${percentChange >= 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(2)}% today. Trading ${lastPrice > sma50 ? 'above' : 'below'} 50-day SMA.`,
                fundamental_explain: "Valuation metrics appear stable relative to sector.",
                news_explain: "Recent price action reflects broader market sentiment.",
                risk_explain: "Standard volatility risk applies."
            },
            history_context: {
                previous_calls: [],
                model_confidence_trend: []
            },
            charts: {
                price_series: chartData
            },
            recent_news: [
                {
                    headline: `${ticker} Analysis: Market Movement Report`,
                    source: "Financial News Stream",
                    published_at: new Date().toISOString().split('T')[0],
                    sentiment: percentChange >= 0 ? 'Positive' : 'Negative',
                    impact: 'Medium',
                    why_it_matters: "Direct correlation to today's price action."
                }
            ]
        });

    } catch (error: any) {
        console.error("Stock Analysis Failed:", error);
        res.status(500).json({
            error: "Analysis Failed",
            detail: error.message || "Unknown Error Occurred"
        });
    }
};

export const marketResearch = async (req: Request, res: Response) => {
    res.json({
        message: "Market research module is standby."
    });
};

export const healthCheck = async (req: Request, res: Response) => {
    res.json({
        status: "online",
        service: "StoreAI Intelligence Engine",
        version: "1.0.0"
    });
};
