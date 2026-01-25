# Testergebnisse und Auswertung

## Server

| Durchlauf | Summe (ms) |
| --------- | ---------- |
| 1         | 342        |
| 2         | 450        |
| 3         | 412        |
| 4         | 380        |
| 5         | 401        |

Durchschnittlicher Wert: ~**0.4ms**
***

## Serverless

| Durchlauf | Summe (ms) | Ø pro Chunk  | Anmerkung  |
| --------- | ---------- | ------------ | ---------- |
| 1         | 37 774     | **1 888 ms** | Cold Start |
| 2         | 26 813     | **1 341 ms** |            |
| 3         | 29 744     | **1 487 ms** |            |
| 4         | 26 545     | **1 327 ms** |            |
| 5         | 28 037     | **1 402 ms** |            |

Durchschnittlicher Wert: ~**1.5s**

## Serverless ohne Cold Start

| Durchlauf | Summe (ms) | Ø pro Chunk  |
| --------- | ---------- | ------------ |
| 1         | 23 268     | **1 454 ms** |
| 2         | 21 505     | **1 344 ms** |
| 3         | 19 955     | **1 247 ms** |
| 4         | 22 140     | **1 384 ms** |

Durchschnittlicher Wert: ~**1.36s**

> Es wurden mehrere Messungen durchgeführt; Bei beiden Anwendugnen handelt es sich lediglich um Auszüge. 