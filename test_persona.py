import requests
import json

url = "http://localhost:8000/api/v1/ai/chat"
headers = {"Content-Type": "application/json"}

scenarios = [
    {"message": "hi", "model": "zara-fast", "desc": "Standard Greeting"},
    {"message": "hi nanba", "model": "zara-fast", "desc": "Tanglish - Nanba"},
    {"message": "hi machi", "model": "zara-fast", "desc": "Tanglish - Machi"}
]

for sc in scenarios:
    print(f"\n--- Testing: {sc['desc']} ---")
    data = {
        "message": sc["message"],
        "model": sc["model"]
    }
    try:
        response = requests.post(url, headers=headers, json=data)
        if response.status_code == 200:
            print(f"User: {sc['message']}")
            print(f"AI:   {response.json()['response']}")
        else:
            print(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Request Failed: {e}")
