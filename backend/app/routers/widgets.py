import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Lottery, Ticket
from app.schemas import WidgetConfig

router = APIRouter(prefix="/api/widgets", tags=["widgets"])

WIDGET_SCRIPT = """
(function() {
  var config = ##CONFIG##;
  var container = document.getElementById(config.containerId || 'lottery-widget');
  if (!container) return;

  var apiBase = config.apiBase || '/api';

  function render() {
    fetch(apiBase + '/widgets/data/' + config.lotteryId)
      .then(r => r.json())
      .then(function(data) {
        var html = '<div class="lw-widget lw-theme-' + (config.theme || 'light') + '">';
        html += '<h3 class="lw-title">' + data.name + '</h3>';
        if (config.showCountdown !== false && data.end_date) {
          html += '<div class="lw-countdown" data-end="' + data.end_date + '"></div>';
        }
        if (config.showTicketCount !== false) {
          html += '<p class="lw-tickets">' + data.ticket_count + ' entries</p>';
        }
        html += '<a class="lw-cta" href="' + (config.ctaUrl || '/') + '">' + (config.ctaText || 'Enter Now') + '</a>';
        html += '</div>';
        container.innerHTML = html;
      });
  }

  render();
  setInterval(render, 30000);
})();
"""


@router.get("/script/{lottery_id}.js", response_class=HTMLResponse)
async def widget_script(
    lottery_id: uuid.UUID,
    theme: str = "light",
    cta_text: str = "Enter Now",
    cta_url: str = "",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lottery).where(Lottery.id == lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")

    config = {
        "lotteryId": str(lottery_id),
        "theme": theme,
        "showCountdown": True,
        "showTicketCount": True,
        "ctaText": cta_text,
        "ctaUrl": cta_url or f"/lottery/{lottery_id}",
        "apiBase": "/api",
    }

    import json

    return HTMLResponse(
        content=WIDGET_SCRIPT.replace("##CONFIG##", json.dumps(config)),
        media_type="application/javascript",
    )


@router.get("/data/{lottery_id}")
async def widget_data(
    lottery_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lottery).where(Lottery.id == lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")

    count_result = await db.execute(
        select(func.count()).select_from(Ticket).where(Ticket.lottery_id == lottery_id)
    )
    ticket_count = count_result.scalar() or 0

    return {
        "id": str(lot.id),
        "name": lot.name,
        "status": lot.status.value,
        "end_date": lot.end_date.isoformat(),
        "draw_date": lot.draw_date.isoformat() if lot.draw_date else None,
        "ticket_count": ticket_count,
        "ticket_price": str(lot.ticket_price),
        "currency": lot.currency,
        "prize_description": lot.prize_description,
    }


@router.get("/iframe/{lottery_id}", response_class=HTMLResponse)
async def widget_iframe(
    lottery_id: uuid.UUID,
    theme: str = "light",
    cta_text: str = "Enter Now",
    cta_url: str = "",
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Lottery).where(Lottery.id == lottery_id))
    lot = result.scalar_one_or_none()
    if not lot:
        raise HTTPException(status_code=404, detail="Lottery not found")

    count_result = await db.execute(
        select(func.count()).select_from(Ticket).where(Ticket.lottery_id == lottery_id)
    )
    ticket_count = count_result.scalar() or 0

    bg = "#1a1a2e" if theme == "dark" else "#ffffff"
    text = "#e0e0e0" if theme == "dark" else "#1a1a2e"
    accent = "#e94560"

    return HTMLResponse(f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{{margin:0;padding:0;box-sizing:border-box}}
body{{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:{bg};color:{text};padding:20px;text-align:center}}
h2{{font-size:1.2rem;margin-bottom:8px}}
.countdown{{font-size:1.8rem;font-weight:700;color:{accent};margin:12px 0;font-variant-numeric:tabular-nums}}
.tickets{{font-size:0.9rem;opacity:0.7;margin-bottom:16px}}
.cta{{display:inline-block;background:{accent};color:#fff;padding:10px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:0.95rem}}
.cta:hover{{opacity:0.9}}
</style></head><body>
<h2>{lot.name}</h2>
<div class="countdown" id="cd">--:--:--</div>
<p class="tickets">{ticket_count} entries &middot; {lot.ticket_price} {lot.currency}</p>
<a class="cta" href="{cta_url or '#'}">{cta_text}</a>
<script>
(function(){{
 var end=new Date("{lot.end_date.isoformat()}").getTime();
 var el=document.getElementById('cd');
 function pad(n){{return n<10?'0'+n:n}}
 setInterval(function(){{
  var now=Date.now(),d=end-now;
  if(d<=0){{el.textContent='Ended';return}}
  var h=Math.floor(d/3600000),m=Math.floor((d%3600000)/60000),s=Math.floor((d%60000)/1000);
  el.textContent=pad(h)+':'+pad(m)+':'+pad(s);
 }},1000);
}})();
</script>
</body></html>""")
