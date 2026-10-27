import re
import io
from typing import Dict, Any, List, Tuple
from pypdf import PdfReader
import docx

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts raw text from PDF bytes using pypdf."""
    text_parts = []
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        for page_idx, page in enumerate(reader.pages):
            page_text = page.extract_text() or ""
            if page_text.strip():
                text_parts.append(page_text.strip())
    except Exception as e:
        raise ValueError(f"Failed to parse PDF file: {str(e)}")
    
    return "\n\n".join(text_parts)

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts raw text from DOCX bytes using python-docx."""
    text_parts = []
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        # Extract normal paragraphs
        for para in doc.paragraphs:
            if para.text.strip():
                text_parts.append(para.text.strip())
        
        # Also extract table text (common in academic/technical resume templates)
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    text_parts.append(" | ".join(row_cells))
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX file: {str(e)}")
    
    return "\n".join(text_parts)

def extract_candidate_entities(raw_text: str, fallback_filename: str = "") -> Dict[str, Any]:
    """
    Extracts candidate contact details, links, and sections from parsed resume text.
    Uses privacy-conscious, non-protected entity extraction.
    """
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    
    # 1. Extract Email
    email_pattern = r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+'
    emails = re.findall(email_pattern, raw_text)
    candidate_email = emails[0] if emails else ""
    
    # 2. Extract Phone
    phone_pattern = r'(?:(?:\+|0{0,2})91[\s-]?)?[6-9]\d{9}|(?:\+?1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}'
    phones = re.findall(phone_pattern, raw_text)
    candidate_phone = phones[0] if phones else ""
    
    # 3. Extract Links (GitHub, LinkedIn, Portfolios)
    link_pattern = r'https?://(?:www\.)?(?:github\.com/[a-zA-Z0-9_-]+|linkedin\.com/in/[a-zA-Z0-9_-]+|[a-zA-Z0-9-]+\.(?:vercel\.app|netlify\.app|github\.io|dev|tech|com))'
    links = list(set(re.findall(link_pattern, raw_text, re.IGNORECASE)))
    
    # Also detect bare github.com/username or linkedin.com/in/username
    bare_github = re.findall(r'(?:github\.com/[a-zA-Z0-9_-]+)', raw_text, re.IGNORECASE)
    bare_linkedin = re.findall(r'(?:linkedin\.com/in/[a-zA-Z0-9_-]+)', raw_text, re.IGNORECASE)
    for link in bare_github + bare_linkedin:
        full_url = f"https://{link}"
        if full_url not in links:
            links.append(full_url)
            
    # 4. Extract Candidate Name
    # Heuristic: First 10 lines, look for 2-4 word alphabetic string that is not an email, URL, or header word
    candidate_name = ""
    ignore_words = {
        "resume", "curriculum", "vitae", "cv", "page", "email", "phone", "contact",
        "education", "experience", "projects", "skills", "summary", "profile",
        "objective", "details", "personal", "github", "linkedin"
    }
    
    for line in lines[:8]:
        clean_line = re.sub(r'[^a-zA-Z\s]', '', line).strip()
        words = clean_line.split()
        if 2 <= len(words) <= 4:
            lower_words = {w.lower() for w in words}
            if not (lower_words & ignore_words) and all(w[0].isupper() for w in words if len(w) > 1):
                candidate_name = clean_line
                break
                
    if not candidate_name:
        # Fallback to sanitized filename
        base_name = fallback_filename.rsplit(".", 1)[0]
        base_name = re.sub(r'[_\-\d]', ' ', base_name).strip()
        candidate_name = base_name.title() if base_name else "Candidate"

    return {
        "candidate_name": candidate_name,
        "candidate_email": candidate_email,
        "candidate_phone": candidate_phone,
        "candidate_links": links,
        "raw_text": raw_text,
    }
