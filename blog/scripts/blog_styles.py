"""SuN 블로그 방향 A — HTML 인라인 스타일 상수"""

ACCENT = "#E8837A"
TEXT = "#2C2C2C"
TEXT_SUB = "#8A8580"
BG_BOX = "#F5F3F0"
FONT = "'Nanum Gothic',나눔고딕,sans-serif"

BODY = (
    f"font-family:{FONT}; font-size:16pt; line-height:1.8; color:{TEXT};"
)
SUBHEAD = (
    f"font-family:{FONT}; font-size:18pt; font-weight:bold; color:{ACCENT}; "
    f"border-left:4px solid {ACCENT}; padding-left:14px; "
    f"margin:32px 0 14px; letter-spacing:0.5px;"
)
TAGS = (
    f"font-family:{FONT}; font-size:14pt; line-height:2; color:{TEXT_SUB}; "
    f"margin-top:32px;"
)
IMG = "max-width:100%; border-radius:12px;"
BOX = (
    f"background:{BG_BOX}; border-radius:10px; padding:20px 24px; margin:20px 0; "
    f"font-family:{FONT}; font-size:15pt; line-height:1.8; color:{TEXT};"
)
