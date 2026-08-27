#!/usr/bin/env bash
set -u
for d in loreloom.com loreloom.ai echora.com echora.ai forklight.com forklight.ai statecraft.com statecraft.ai worldline.com worldline.ai paracosm.com paracosm.ai simulora.com simulora.ai morroway.com morroway.ai; do
  echo "=== $d ==="
  if getent hosts "$d" >/dev/null 2>&1; then echo "DNS: resolves"; else echo "DNS: no resolution"; fi
  if [[ "$d" == *.com ]]; then
    url="https://rdap.verisign.com/com/v1/domain/$d"
  else
    url="https://rdap.identitydigital.services/rdap/domain/$d"
  fi
  code=$(curl -L -sS -o /tmp/rdap_out -w '%{http_code}' --max-time 10 "$url" || true)
  echo "RDAP HTTP: $code"
  if [[ "$code" == "200" ]]; then
    grep -Eo '"(ldhName|status)"[^]]*' /tmp/rdap_out | head -c 300; echo
  fi
done
