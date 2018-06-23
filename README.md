# HTTP Request Translator

Before:

```bash
curl 'https://rec.api.nytimes.com/svc/recommendations/v4/block/home-living.json?hydration=1&limit=2' \
-XGET \
-H 'Origin: https://www.nytimes.com' \
-H 'Host: rec.api.nytimes.com' \
-H 'DNT: 1' \
-H 'Connection: keep-alive' \
-H 'Accept-Language: en-us' \
-H 'Accept-Encoding: br, gzip, deflate' \
-H 'Cookie: nyt-a=J3Ary6tZ2D1PZ1Ur1FUePq; nyt-gdpr=0; vi_www_hp=z00' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15' \
-H 'Accept: */*' \
-H 'Referer: https://www.nytimes.com/'
```

After:

```python
import requests

requests.get(
  'https://rec.api.nytimes.com/svc/recommendations/v4/block/home-living.json',
  params={'hydration': '1', 'limit': '2'},
  headers={
    'Accept': '*/*',
    'Accept-Encoding': 'br, gzip, deflate',
    'Accept-Language': 'en-us',
    'Connection': 'keep-alive',
    'Cookie': 'nyt-a=J3Ary6tZ2D1PZ1Ur1FUePq; nyt-gdpr=0; vi_www_hp=z00',
    'DNT': '1',
    'Origin': 'https://www.nytimes.com',
    'Referer': 'https://www.nytimes.com/',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) '
                  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 '
                  'Safari/605.1.15'
  },
)
```

**Hint:** You can generate curl commands in the Safari Web Inspector by right-clicking on a resource in the Network or Resources tab and selecting "Copy as cURL".
