from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO
from datetime import datetime

from database import get_db
import models
from auth import get_current_user
from suggestions_data import get_all_suggestions

router = APIRouter(prefix="/api/reports", tags=["reports"])


def create_pdf_report(user: models.User, scores: list, suggestions: list) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    import os

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm,
                            topMargin=20*mm, bottomMargin=20*mm)
    styles = getSampleStyleSheet()
    story = []

    # Title
    title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=18,
                                  textColor=colors.HexColor('#1e3a5f'))
    story.append(Paragraph("Personal Brain Capital Monitor (PBCM)", title_style))
    story.append(Paragraph(f"レポート生成日: {datetime.now().strftime('%Y-%m-%d')}", styles['Normal']))
    story.append(Spacer(1, 10*mm))

    # Score history table
    if scores:
        story.append(Paragraph("スコア推移", styles['Heading2']))
        story.append(Spacer(1, 3*mm))

        table_data = [["日付", "Drivers", "Health", "Skills", "総合スコア"]]
        for s in scores[-6:]:  # last 6 records
            date_str = s.date.strftime('%Y-%m-%d') if hasattr(s.date, 'strftime') else str(s.date)[:10]
            table_data.append([
                date_str,
                f"{s.pillar1_score:.1f}" if s.pillar1_score else "-",
                f"{s.pillar2_score:.1f}" if s.pillar2_score else "-",
                f"{s.pillar3_score:.1f}" if s.pillar3_score else "-",
                f"{s.total_score:.1f}" if s.total_score else "-",
            ])

        table = Table(table_data, colWidths=[40*mm, 30*mm, 30*mm, 30*mm, 35*mm])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a5f')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f0f4f8')]),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(table)
        story.append(Spacer(1, 8*mm))

    # Latest score
    if scores:
        latest = scores[-1]
        story.append(Paragraph("最新スコア", styles['Heading2']))
        story.append(Spacer(1, 3*mm))
        score_data = [
            ["Brain Capital Drivers (生活習慣)", f"{latest.pillar1_score:.1f}/100" if latest.pillar1_score else "-"],
            ["Brain Health (脳の健康)", f"{latest.pillar2_score:.1f}/100" if latest.pillar2_score else "-"],
            ["Brain Skills (認知・非認知スキル)", f"{latest.pillar3_score:.1f}/100" if latest.pillar3_score else "-"],
            ["総合 Brain Capital Score", f"{latest.total_score:.1f}/100" if latest.total_score else "-"],
        ]
        t = Table(score_data, colWidths=[100*mm, 50*mm])
        t.setStyle(TableStyle([
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#e8f4f8')),
            ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ]))
        story.append(t)
        story.append(Spacer(1, 8*mm))

    # Suggestions
    if suggestions:
        story.append(Paragraph("改善提案", styles['Heading2']))
        story.append(Spacer(1, 3*mm))
        for sug in suggestions:
            story.append(Paragraph(sug.get('title', ''), styles['Heading3']))
            story.append(Paragraph(sug.get('body', ''), styles['Normal']))
            actions = sug.get('actions', [])
            for action in actions:
                story.append(Paragraph(f"• {action}", styles['Normal']))
            story.append(Spacer(1, 5*mm))

    # Disclaimer
    story.append(Spacer(1, 10*mm))
    disclaimer_style = ParagraphStyle('disclaimer', parent=styles['Normal'],
                                      fontSize=8, textColor=colors.grey)
    story.append(Paragraph(
        "【免責事項】このレポートは個人の自己改善目的のみに使用されます。医療診断・医療行為ではありません。"
        "健康上の懸念がある場合は医療専門家にご相談ください。",
        disclaimer_style
    ))

    doc.build(story)
    buf.seek(0)
    return buf.read()


@router.get("/pdf")
def download_pdf(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scores = (
        db.query(models.Score)
        .filter(models.Score.user_id == current_user.id)
        .order_by(models.Score.date.asc())
        .all()
    )

    latest = scores[-1] if scores else None
    suggestions = []
    if latest:
        suggestions = get_all_suggestions(
            drivers=latest.pillar1_score or 50,
            health=latest.pillar2_score or 50,
            skills=latest.pillar3_score or 50,
            lang=current_user.language or "ja"
        )

    pdf_bytes = create_pdf_report(current_user, scores, suggestions)

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=pbcm_report.pdf"}
    )
