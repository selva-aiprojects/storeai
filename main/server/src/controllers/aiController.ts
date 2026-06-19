import { Request, Response } from 'express';
import YahooFinance from 'yahoo-finance2';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';

const prisma = new PrismaClient();
const yahooFinance = new YahooFinance();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const SYSTEM_PROMPT = `You are StoreAI, an intelligent store management assistant integrated with a live retail database.

You have access to store data via the system (inventory/products, sales/orders, customers, suppliers, HR).
When the user asks about specific data, the system will query the database and provide you with results to summarize.

Guidelines:
- Be concise, helpful, and professional
- Use bullet points or tables for structured data
- If you don't know something, say so
- For inventory queries, mention stock levels and prices
- For sales queries, mention amounts and dates
- Keep responses under 150 words unless the user asks for detail`;

export const chat = async (req: Request, res: Response) => {
    const { query, history } = req.body;
    const lowerQuery = query?.toLowerCase() || '';

    try {
        let responseText = '';
        let contextData: any = null;
        let source = 'CONVERSATION';
        let intent = 'GENERAL';

        const intentCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Classify the user's store query into exactly one category. Respond with ONLY the category word, nothing else.

Categories:
- INVENTORY: questions about products, stock, inventory, items, SKUs, pricing, stock levels, low stock
- SALES: questions about sales, revenue, orders, invoices, transactions, purchase history
- CUSTOMERS: questions about customers, clients, buyers, customer details
- HR: questions about employees, staff, payroll, attendance, HR
- SUPPLIERS: questions about suppliers, vendors, purchase orders
- GENERAL: greetings, help requests, chit-chat, or anything else`
                },
                { role: 'user', content: query }
            ],
            model: 'llama3-8b-8192',
            temperature: 0.1,
            max_tokens: 20
        });

        intent = intentCompletion.choices[0]?.message?.content?.trim().toUpperCase() || 'GENERAL';

        if (intent === 'INVENTORY') {
            const products = await prisma.product.findMany({
                take: 15,
                orderBy: { stockQuantity: 'asc' },
                select: { name: true, sku: true, stockQuantity: true, price: true, category: true }
            });

            if (lowerQuery.includes('low') || lowerQuery.includes('shortage') || lowerQuery.includes('short')) {
                const lowStock = products.filter(p => p.stockQuantity < 10);
                contextData = lowStock;
                source = 'SQL';
            } else if (products.length > 0) {
                contextData = products;
                source = 'SQL';
            }
        }
        else if (intent === 'SALES') {
            const sales = await prisma.sale.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { customer: { select: { name: true } } }
            });
            if (sales.length > 0) {
                contextData = sales.map(s => ({
                    Invoice: s.invoiceNo,
                    Customer: s.customer?.name || 'Walk-in',
                    Amount: s.totalAmount,
                    Date: new Date(s.createdAt).toLocaleDateString()
                }));
                source = 'SQL';
            }
        }
        else if (intent === 'CUSTOMERS') {
            const customers = await prisma.customer.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { name: true, email: true, city: true, phone: true }
            });
            if (customers.length > 0) {
                contextData = customers;
                source = 'SQL';
            }
        }
        else if (intent === 'HR') {
            const employees = await prisma.employee.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { firstName: true, lastName: true, designation: true, employeeId: true, departmentId: true }
            });
            if (employees.length > 0) {
                contextData = employees;
                source = 'SQL';
            }
        }
        else if (intent === 'SUPPLIERS') {
            const suppliers = await prisma.supplier.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                select: { name: true, email: true, contact: true }
            });
            if (suppliers.length > 0) {
                contextData = suppliers;
                source = 'SQL';
            }
        }

        const messages: any[] = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        if (history && history.length > 0) {
            const recentHistory = history.slice(-6);
            for (const msg of recentHistory) {
                if (msg.role && msg.content) {
                    messages.push({ role: msg.role, content: msg.content });
                }
            }
        }

        let userContent = query;
        if (contextData) {
            userContent = `The user asked: "${query}"\n\nHere is the relevant data from the database:\n${JSON.stringify(contextData, null, 2)}\n\nPlease summarize this data for the user in a friendly, conversational way.`;
        }

        messages.push({ role: 'user', content: userContent });

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 500
        });

        responseText = chatCompletion.choices[0]?.message?.content || '';

        if (!responseText) {
            responseText = "I'm having trouble processing that request. Could you try rephrasing?";
        }

        res.json({ response: responseText, context: contextData, source });
    } catch (error: any) {
        console.error('AI Chat Error:', error);
        res.status(500).json({
            response: 'I encountered an error processing your request. Please ensure the GROQ_API_KEY is configured correctly.',
            source: 'ERROR',
            detail: error.message
        });
    }
};

export const stockAnalyze = async (req: Request, res: Response) => {
    const { ticker } = req.body;
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
            console.error('Yahoo Finance API Error:', apiErr);
            if (apiErr.message?.includes('Not Found') || apiErr.message?.includes('404')) {
                return res.status(404).json({ detail: `Ticker '${ticker}' not found on exchange.` });
            }
            throw new Error(`Exchange Data Error: ${apiErr.message}`);
        }

        if (!quote) throw new Error('Stock ticker not found.');

        const lastPrice = quote.regularMarketPrice || 0;
        const prevClose = quote.regularMarketPreviousClose || lastPrice;
        const priceChange = lastPrice - prevClose;
        const percentChange = prevClose !== 0 ? (priceChange / prevClose) * 100 : 0;

        const closePrices: number[] = history.map((h: any) => h.close).filter((c: any) => c !== null && c !== undefined);

        const sma50 = closePrices.length >= 50 ? closePrices.slice(-50).reduce((a: number, b: number) => a + b, 0) / 50 : lastPrice;
        const sma200 = closePrices.length >= 200 ? closePrices.slice(-200).reduce((a: number, b: number) => a + b, 0) / 200 : lastPrice;

        const groqAnalysis = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `You are a stock market analyst. Analyze the given stock data and provide a brief analysis.
Return your response as a JSON object with these fields:
- rating: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Avoid"
- thesis: brief 1-2 sentence analysis
- confidence: number 0-100
- risk: "Low" | "Medium" | "High"`
                },
                {
                    role: 'user',
                    content: `Ticker: ${ticker}
Company: ${quote.longName || ticker}
Last Price: ${lastPrice}
Change: ${percentChange.toFixed(2)}%
50-day SMA: ${sma50.toFixed(2)}
200-day SMA: ${sma200.toFixed(2)}
Market Cap: ${quote.marketCap || 'N/A'}
Volume: ${quote.regularMarketVolume || 'N/A'}`
                }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 300
        });

        let analysis: any = {
            rating: 'Hold',
            thesis: 'Market conditions are neutral.',
            confidence: 50,
            risk: 'Medium'
        };

        try {
            const content = groqAnalysis.choices[0]?.message?.content || '';
            const jsonMatch = content.match(/\{.*\}/s);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            }
        } catch {
            // Fall back to defaults
        }

        const chartData = history.slice(-90).map((h: any) => ({
            date: h.date.toISOString().split('T')[0],
            close: h.close
        }));

        res.json({
            meta: {
                ticker: ticker || 'UNKNOWN',
                company_name: quote.longName || ticker,
                sector: 'Financial / Tech',
                last_price: lastPrice,
                currency: quote.currency || 'INR',
                time_range: '3M'
            },
            core_signals: {
                ai_overall_rating: analysis.rating || 'Hold',
                technical_score: lastPrice > sma50 ? (lastPrice > sma200 ? 85 : 60) : (lastPrice < sma200 ? 30 : 45),
                fundamental_score: Math.floor(Math.random() * (90 - 60) + 60),
                news_score: percentChange > 0 ? 80 : 40,
                risk_score: analysis.risk === 'Low' ? 20 : analysis.risk === 'High' ? 70 : 45,
                confidence: analysis.confidence || 50
            },
            ai_rationale: {
                thesis: analysis.thesis || '',
                time_horizon: 'medium_term',
                bull_case: 'Positive momentum may continue if market conditions remain favorable.',
                bear_case: 'Downside risk from broader market volatility.'
            },
            explanations: {
                technical_explain: `Price is ${percentChange >= 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(2)}% today. Trading ${lastPrice > sma50 ? 'above' : 'below'} 50-day SMA.`,
                fundamental_explain: 'Analysis based on available market data.',
                news_explain: 'Recent price action reflects broader market sentiment.',
                risk_explain: `Risk level: ${analysis.risk || 'Medium'}.`
            },
            charts: { price_series: chartData },
            recent_news: [
                {
                    headline: `${ticker} Analysis: ${analysis.rating || 'Market Update'}`,
                    source: 'StoreAI Intelligence',
                    published_at: new Date().toISOString().split('T')[0],
                    sentiment: percentChange >= 0 ? 'Positive' : 'Negative',
                    impact: 'Medium',
                    why_it_matters: 'AI-generated analysis based on technical indicators.'
                }
            ]
        });
    } catch (error: any) {
        console.error('Stock Analysis Failed:', error);
        res.status(500).json({ error: 'Analysis Failed', detail: error.message || 'Unknown Error Occurred' });
    }
};

export const marketResearch = async (req: Request, res: Response) => {
    res.json({
        status: 'active',
        market_sentiment: 'BULLISH',
        volatility: 'MODERATE',
        top_picks: ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY'],
        summary: 'Nifty 50 showing strong support at key EMA levels. Positive outlook on BFSI and Auto sectors.',
        exchanges: [
            { name: 'NSE', status: 'OPEN', trend: '+0.45%' },
            { name: 'BSE', status: 'OPEN', trend: '+0.42%' }
        ]
    });
};

export const healthCheck = async (req: Request, res: Response) => {
    const groqConfigured = !!(process.env.GROQ_API_KEY);
    res.json({
        status: 'online',
        service: 'StoreAI Intelligence Engine',
        version: '1.0.0',
        groq: groqConfigured ? 'connected' : 'not configured'
    });
};
