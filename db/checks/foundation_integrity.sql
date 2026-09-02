select key, value
from app_meta.foundation_metadata
where key = 'implementation_phase'
  and value->>'phase' = 'IP-3'
  and value->>'productSemanticsStarted' = 'true';
