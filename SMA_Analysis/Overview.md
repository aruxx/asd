# Overview

SMA outfits function as the orchestration layer for public equities. They determine *when* and *how* the largest trading divisions deploy capital, modulate volatility, and enforce directional bias. Thinking of SMA selections as isolated indicators misses the point: outfits are multi-parameter governance rules that regulate the handoff of liquidity between aggressive desks and the broader market.

## Why SMA Outfits Matter
- **Directional Governance:** A "positive" S&P, NASDAQ, or Dow program is simply one where the short baseline SMA trades above the long baseline. These binary states signal whether institutions are net supportive or net extractive.
- **Capital Budgeting:** Each outfit encodes not only price-level triggers but also timeframe budgets (minutes, hours, days) so that liquidity can be staged, recycled, or withdrawn without disrupting macro narratives.
- **Cross-Market Synchronization:** Outfits are mirrored across indices, volatility gauges, leveraged ETFs, crypto proxies, and rate products, ensuring that signals ripple through every liquidity channel.
- **Evidence of Control:** When the S&P tags its MA200 while NASDAQ tags its MA250 and Dow tags its MA900, outcomes become deterministic. These are not coincidences—they are coordinated circuit-breaker style events.

## Baseline Systems
| System | Outfit | Native Timeframe | Positive Definition | Negative Definition |
| --- | --- | --- | --- | --- |
| S&P 500 (SPX) | 10 / 50 / 200 | 30-minute | MA10 trades above MA50 | MA10 trades below MA50 |
| NASDAQ (IXIC) | 20 / 100 / 250 | 20-minute and 30-minute | MA20 trades above MA100 | MA20 trades below MA100 |
| Dow Jones (DJI) | 30 / 60 / 90 / 300 / 600 / 900 | 15-minute and 1-hour | MA90 trades above MA300 | MA90 trades below MA300 |

When volatility spikes, the enforcement rules adapt: candle closes above the long SMA confirm support, while closes below confirm liquidation status. The outfits themselves do not change—only the enforcement intensity does.

## Institutional Hour vs Extended Hour
The institutional session (09:30–16:00 EST) is the canonical playground for SMA outfits, but extended hours inherit cascading instructions. Arbitrage detection systems explicitly monitor handoffs between these sessions to maintain continuity in liquidity provisioning, directionality, and volatility management.

## Transparency Mandate
This repository treats SMA outfits as public infrastructure. By documenting the precise integers, timeframes, and operational definitions, the intent is to eliminate the mystique surrounding so-called "black box" systems. Disseminating this information invites academics, regulators, and market participants to interrogate the fairness and resilience of a market that is, in practice, centrally choreographed through SMA outfits. EOF
