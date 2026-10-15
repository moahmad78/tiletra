import json
import urllib.request
import ssl

ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

url = "https://www.intrihub.com/api/orders"
headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 IntriHubApp/1.0"
}

print("=== TEST 1: AUTO-ACCEPTANCE FLOW (Stock >= Ordered Qty) ===")
auto_order_payload = {
    "customerName": "Test Customer AutoAccept",
    "customerPhone": "9876543210",
    "customerEmail": "customer.test@intrihub.com",
    "paymentMethod": "COD",
    "shippingAddress": {
        "fullName": "Test Customer",
        "phone": "9876543210",
        "street": "100 Feet Road, Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560038"
    },
    "items": [
        {
            "productId": "cmt644okh0001jj2336qerjmd",
            "variantId": "cmt649xs70007jj23wcihy49g",
            "productName": "M sand 50 kg bag",
            "boxQuantity": 1,
            "pricePerBox": 249
        }
    ]
}

req1 = urllib.request.Request(url, data=json.dumps(auto_order_payload).encode("utf-8"), headers=headers)
try:
    with urllib.request.urlopen(req1, context=ssl_ctx) as resp:
        res1 = json.loads(resp.read().decode("utf-8"))
        print("Success:", res1.get("success"))
        print("OrderId:", res1.get("orderId"))
        print("OrderStatus:", res1.get("status"))
        print("AutoAccepted:", res1.get("autoAccepted"))
        print("Message:", res1.get("message"))
        print("InventoryDetails:", res1.get("inventoryDetails"))
except Exception as e:
    print("Test 1 Failed:", e)

print("\n=== TEST 2: MANUAL FALLBACK FLOW (Stock < Ordered Qty / Out-of-Stock) ===")
manual_order_payload = {
    "customerName": "Test Customer ManualFallback",
    "customerPhone": "9876543210",
    "customerEmail": "customer.test@intrihub.com",
    "paymentMethod": "COD",
    "shippingAddress": {
        "fullName": "Test Customer",
        "phone": "9876543210",
        "street": "100 Feet Road, Indiranagar",
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560038"
    },
    "items": [
        {
            "productId": "cmt644okh0001jj2336qerjmd",
            "variantId": "cmt649xs70007jj23wcihy49g",
            "productName": "M sand 50 kg bag",
            "boxQuantity": 999999,  # Intentionally massive quantity to exceed available stock
            "pricePerBox": 249
        }
    ]
}

req2 = urllib.request.Request(url, data=json.dumps(manual_order_payload).encode("utf-8"), headers=headers)
try:
    with urllib.request.urlopen(req2, context=ssl_ctx) as resp:
        res2 = json.loads(resp.read().decode("utf-8"))
        print("Success:", res2.get("success"))
        print("OrderId:", res2.get("orderId"))
        print("OrderStatus:", res2.get("status"))
        print("AutoAccepted:", res2.get("autoAccepted"))
        print("Message:", res2.get("message"))
        print("InventoryDetails:", res2.get("inventoryDetails"))
except Exception as e:
    print("Test 2 Failed:", e)
