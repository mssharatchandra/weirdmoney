#!/usr/bin/env python3
"""Publish one human-approved WYRD drop to X, Convex, and Telegram."""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import requests
from dotenv import load_dotenv
from requests_oauthlib import OAuth1

X_API = "https://api.x.com/2"


def required(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise SystemExit(f"missing {name}")
    return value


def market_by_id(gateway: str, market_id: str) -> dict:
    response = requests.get(gateway, params={"limit": 25}, timeout=45)
    response.raise_for_status()
    for market in response.json().get("markets", []):
        if str(market.get("id")) == market_id:
            return market
    raise SystemExit(f"market {market_id} is not in the current safe WYRD index")


def x_auth() -> OAuth1:
    return OAuth1(
        required("X_API_KEY"),
        required("X_API_SECRET"),
        required("X_ACCESS_TOKEN"),
        required("X_ACCESS_TOKEN_SECRET"),
    )


def create_x_post(auth: OAuth1, payload: dict) -> str:
    response = requests.post(f"{X_API}/tweets", auth=auth, json=payload, timeout=30)
    if response.status_code not in (200, 201):
        raise SystemExit(f"X publish failed ({response.status_code}): {response.text[:300]}")
    post_id = response.json().get("data", {}).get("id")
    if not post_id:
        raise SystemExit("X did not return a post id")
    return str(post_id)


def log_to_convex(convex: str, market: dict, text: str, fmt: str, post_url: str) -> None:
    response = requests.post(
        f"{convex}/api/logPost",
        json={
            "marketId": str(market["id"]),
            "question": market["question"],
            "text": text,
            "format": fmt,
            "url": post_url,
            "platform": "x",
        },
        timeout=30,
    )
    response.raise_for_status()


def broadcast_telegram(convex: str, token: str, market: dict, text: str, dashboard: str) -> tuple[int, int]:
    response = requests.get(f"{convex}/api/subscribers", timeout=30)
    response.raise_for_status()
    subscribers = response.json().get("subscribers", [])
    message = f"{text}\n\nsource: {market['url']}\nweird index: {dashboard}/dashboard"
    sent = failed = 0
    for subscriber in subscribers:
        chat_id = subscriber.get("tgUserId")
        if not chat_id:
            continue
        result = requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            json={"chat_id": chat_id, "text": message, "disable_web_page_preview": True},
            timeout=30,
        )
        if result.ok:
            sent += 1
        else:
            failed += 1
    return sent, failed


def main() -> None:
    load_dotenv(Path.home() / ".hermes" / ".env")
    parser = argparse.ArgumentParser()
    parser.add_argument("--market-id", required=True)
    parser.add_argument("--text", required=True)
    parser.add_argument("--format", default="deadpan stat drop")
    parser.add_argument("--publish", action="store_true", help="perform real external writes")
    args = parser.parse_args()

    text = args.text.strip()
    if not text or len(text) > 280:
        raise SystemExit("post must contain 1–280 characters")

    gateway = required("WYRD_GATEWAY_URL")
    convex = required("WYRD_CONVEX_URL").rstrip("/")
    landing = required("WYRD_LANDING_URL").rstrip("/")
    username = required("X_BOT_USERNAME").lstrip("@").lower()
    market = market_by_id(gateway, args.market_id)

    print(f"market: {market['question']}")
    print(f"facts: {market.get('yesPct')}% YES · ${round(float(market.get('volume', 0))):,} total volume")
    print(f"copy ({len(text)} chars): {text}")
    print(f"source: {market['url']}")
    if not args.publish:
        print("preview complete; no external writes (pass --publish after human approval)")
        return

    auth = x_auth()
    identity = requests.get(f"{X_API}/users/me", auth=auth, timeout=30)
    identity.raise_for_status()
    actual = str(identity.json().get("data", {}).get("username", "")).lower()
    if actual != username:
        raise SystemExit(f"token belongs to @{actual}, expected @{username}")

    post_id = create_x_post(auth, {"text": text})
    post_url = f"https://x.com/{username}/status/{post_id}"
    reply = f"source: {market['url']}\nweird index: {landing}/dashboard"
    create_x_post(auth, {"text": reply, "reply": {"in_reply_to_tweet_id": post_id}})
    log_to_convex(convex, market, text, args.format, post_url)
    sent, failed = broadcast_telegram(convex, required("TELEGRAM_BOT_TOKEN"), market, text, landing)
    print(f"published: {post_url}")
    print(f"telegram: {sent} sent, {failed} failed")


if __name__ == "__main__":
    main()
