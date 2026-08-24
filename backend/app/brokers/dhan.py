import httpx

from app.brokers.base import BrokerAdapter, OrderRequest, OrderResponse
from app.config import settings


class DhanAdapter(BrokerAdapter):
    """DhanHQ API v2 adapter. Order APIs require static IP whitelisting."""

    def __init__(self, access_token: str, client_id: str | None = None):
        self.access_token = access_token
        self.client_id = client_id
        self.base_url = settings.dhan_api_base_url

    def _headers(self) -> dict[str, str]:
        return {
            "access-token": self.access_token,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.request(
                method,
                f"{self.base_url}{path}",
                headers=self._headers(),
                **kwargs,
            )
            if response.status_code >= 400:
                raise RuntimeError(f"Dhan API error {response.status_code}: {response.text}")
            return response.json() if response.content else {}

    async def authenticate(self, credentials: dict) -> bool:
        token = credentials.get("access_token") or credentials.get("api_key")
        if token:
            self.access_token = token
        await self.get_funds()
        return True

    async def get_funds(self) -> dict:
        return await self._request("GET", "/fundlimit")

    async def get_holdings(self) -> list[dict]:
        data = await self._request("GET", "/holdings")
        return data if isinstance(data, list) else data.get("data", [])

    async def get_positions(self) -> list[dict]:
        data = await self._request("GET", "/positions")
        return data if isinstance(data, list) else data.get("data", [])

    async def get_orders(self) -> list[dict]:
        data = await self._request("GET", "/orders")
        return data if isinstance(data, list) else data.get("data", [])

    async def place_order(self, order: OrderRequest) -> OrderResponse:
        payload = {
            "dhanClientId": self.client_id,
            "transactionType": order.side,
            "exchangeSegment": order.exchange,
            "productType": order.product_type,
            "orderType": order.order_type,
            "validity": "DAY",
            "securityId": order.symbol,
            "quantity": order.quantity,
            "price": order.price or 0,
            "correlationId": order.correlation_id,
        }
        data = await self._request("POST", "/orders", json=payload)
        return OrderResponse(
            order_id=str(data.get("orderId", "")),
            status=data.get("orderStatus", "PENDING"),
            broker_order_id=str(data.get("orderId", "")),
        )

    async def modify_order(self, order_id: str, changes: dict) -> OrderResponse:
        data = await self._request("PUT", f"/orders/{order_id}", json=changes)
        return OrderResponse(order_id=order_id, status=data.get("orderStatus", "MODIFIED"))

    async def cancel_order(self, order_id: str) -> OrderResponse:
        await self._request("DELETE", f"/orders/{order_id}")
        return OrderResponse(order_id=order_id, status="CANCELLED")

    async def get_market_quote(self, symbols: list[str]) -> dict:
        return await self._request("POST", "/marketfeed/ltp", json={"NSE_EQ": symbols})

    async def health_check(self) -> bool:
        try:
            await self.get_funds()
            return True
        except Exception:
            return False
