from datetime import datetime, timezone

from app.config import settings


_MOCK_NEWS = [
    {
        "id": "mock-1",
        "headline": "Nifty trades higher as banking stocks gain momentum",
        "summary": "Indian benchmarks rose in early trade led by financials.",
        "source": "Market News",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "url": "https://www.gnkalgo.com",
        "category": "market",
        "symbol": None,
        "thumbnail": None,
    },
    {
        "id": "mock-2",
        "headline": "RBI maintains stance on liquidity; focus on inflation",
        "summary": "Policy commentary shapes rate expectations.",
        "source": "Economy",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "url": "https://www.gnkalgo.com",
        "category": "economy",
        "symbol": None,
        "thumbnail": None,
    },
    {
        "id": "mock-3",
        "headline": "Reliance Industries expands digital services footprint",
        "summary": "Conglomerate updates on Jio and retail segments.",
        "source": "Stocks",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "url": "https://www.gnkalgo.com",
        "category": "stocks",
        "symbol": "RELIANCE",
        "thumbnail": None,
    },
    {
        "id": "mock-4",
        "headline": "FII activity remains mixed amid global cues",
        "summary": "Overseas investors watch US macro data.",
        "source": "Market News",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "url": "https://www.gnkalgo.com",
        "category": "market",
        "symbol": None,
        "thumbnail": None,
    },
    {
        "id": "mock-5",
        "headline": "TCS reports steady enterprise demand",
        "summary": "IT sector outlook in focus for investors.",
        "source": "Company",
        "published_at": datetime.now(timezone.utc).isoformat(),
        "url": "https://www.gnkalgo.com",
        "category": "company",
        "symbol": "TCS",
        "thumbnail": None,
    },
]

_SYMBOL_KEYWORDS = {
    "RELIANCE": ["reliance", "jio", "oil", "energy"],
    "TCS": ["tcs", "tata consultancy"],
    "HDFCBANK": ["hdfc bank", "hdfcbank"],
    "INFY": ["infosys", "infy"],
    "NIFTY": ["nifty", "sensex", "indian market", "rbi", "fii", "dii"],
}


class NewsService:
    def latest(self, limit: int = 10, symbol: str | None = None) -> dict:
        use_mock = settings.app_env != "production" or settings.debug
        items = list(_MOCK_NEWS)

        if symbol:
            sym = symbol.upper()
            keywords = _SYMBOL_KEYWORDS.get(sym, [sym.lower()])
            filtered = [
                n for n in items
                if n["symbol"] == sym
                or any(k in n["headline"].lower() for k in keywords)
            ]
            if filtered:
                items = filtered + [n for n in items if n not in filtered]

        items = items[:limit]
        for item in items:
            item["is_mock"] = use_mock

        return {
            "items": items,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "source": "mock_dev" if use_mock else "provider",
            "symbol": symbol,
        }


news_service = NewsService()
