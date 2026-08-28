from app.data.instrument_master import INSTRUMENTS, _SYMBOL_ALIASES


class InstrumentService:
    def search(self, q: str, limit: int = 20) -> list[dict]:
        if not q or len(q.strip()) < 1:
            return INSTRUMENTS[:limit]
        raw = q.strip().upper()
        key = _SYMBOL_ALIASES.get(raw, raw)
        results = []
        for inst in INSTRUMENTS:
            if (
                key in inst["symbol"]
                or key in inst["display_name"].upper()
                or raw in inst["display_name"].upper()
            ):
                results.append(inst)
        if not results:
            for inst in INSTRUMENTS:
                if any(part.startswith(key[:3]) for part in inst["symbol"].split()):
                    results.append(inst)
        return results[:limit]

    def get(self, symbol: str) -> dict | None:
        sym = symbol.strip().upper()
        sym = _SYMBOL_ALIASES.get(sym, sym)
        for inst in INSTRUMENTS:
            if inst["symbol"] == sym:
                return inst
        return None


instrument_service = InstrumentService()
