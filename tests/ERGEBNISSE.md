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

Bei 20 insgesamt gesendeten Chunks ergibt sich ein durchschnittlicher Wert von ~**1.5s**

## Serverless ohne Cold Start

| Durchlauf | Summe (ms) | Ø pro Chunk  |
| --------- | ---------- | ------------ |
| 1         | 23 268     | **1 454 ms** |
| 2         | 21 505     | **1 344 ms** |
| 3         | 19 955     | **1 247 ms** |
| 4         | 22 140     | **1 384 ms** |

Bei 20 insgesamt gesendeten Chunks ergibt sich ein durchschnittlicher Wert von ~**1.36s**

> Es wurden mehrere Messungen durchgeführt; Bei beiden Anwendugnen handelt es sich lediglich um Auszüge. 


### Weitere Messungen

| Testlauf | Server (ms) | Serverless (ms) | Serverless ohne Cold Start (ms) |
| -------- | ------------ | ---------------- | -------------------------------- |
| 1        | 395          | 28 037           | 22 140                           |
| 2        | 410          | 26 545           | 21 505                           |
| 3        | 380          | 29 744           | 19 955                           |
| 4        | 402          | 26 813           | 23 268                           |
| 5        | 345          | 37 774           | 24 019                           |
| 6        | 388          | 27 450           | 20 890                           |
| 7        | 415          | 31 120           | 22 415                           |
| 8        | 372          | 25 980           | 21 030                           |
| 9        | 398          | 28 655           | 19 760                           |
| 10       | 405          | 33 240           | 24 110                           |
| Ø        | ~395         | ~28 000          | ~21 500                          |