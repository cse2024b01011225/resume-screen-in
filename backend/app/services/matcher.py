import re
from typing import Dict, Any, List, Set, Tuple

# Comprehensive Tech Synonyms & Canonical mapping
SKILL_SYNONYMS: Dict[str, List[str]] = {
    "python": ["python", "py", "python3", "cpython"],
    "fastapi": ["fastapi", "fast-api", "starlette"],
    "react": ["react", "react.js", "reactjs", "react native"],
    "javascript": ["javascript", "js", "ecmascript"],
    "typescript": ["typescript", "ts"],
    "sqlite": ["sqlite", "sqlite3"],
    "sql": ["sql", "mysql", "postgresql", "postgres", "rdbms", "database queries"],
    "mongodb": ["mongodb", "mongo", "nosql"],
    "html/css": ["html", "html5", "css", "css3", "tailwind", "bootstrap", "sass"],
    "git": ["git", "github", "gitlab", "version control"],
    "rest api": ["rest api", "restful", "restful api", "apis", "api integration", "api development", "endpoints"],
    "docker": ["docker", "containerization", "containers", "dockerfile"],
    "kubernetes": ["kubernetes", "k8s"],
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "azure": ["azure", "microsoft azure"],
    "machine learning": ["machine learning", "ml", "deep learning", "neural networks", "scikit-learn", "sklearn"],
    "llm": ["llm", "large language model", "gpt", "gemini", "langchain", "prompt engineering", "transformers", "nlp"],
    "data science": ["data science", "pandas", "numpy", "matplotlib", "seaborn", "data analysis"],
    "node.js": ["node", "node.js", "nodejs", "express", "express.js"],
    "java": ["java", "spring", "spring boot"],
    "c++": ["c++", "cpp"],
    "c": ["c language", "embedded c"],
    "linux": ["linux", "unix", "bash", "shell scripting"],
    "testing": ["unit testing", "pytest", "jest", "selenium", "qa", "test automation"],
    "ci/cd": ["ci/cd", "continuous integration", "github actions", "jenkins"],
}

EDUCATION_KEYWORDS = {
    "bachelor": ["bachelor", "b.tech", "btech", "b.e.", "be", "bca", "b.sc", "bsc", "b.s.", "undergraduate"],
    "master": ["master", "m.tech", "mtech", "m.e.", "mca", "m.sc", "msc", "m.s.", "postgraduate", "mba"],
    "doctorate": ["ph.d", "phd", "doctorate"],
    "fields": ["computer science", "information technology", "cse", "it", "software engineering", "electronics", "data science"],
}

FRESHER_INDICATORS = [
    "academic project", "final year project", "capstone", "mini project", "semester project",
    "intern", "internship", "summer trainee", "apprentice",
    "certification", "certified", "coursera", "udemy", "nptel", "hackerrank", "leetcode", "codeforces",
    "github.com", "portfolio", "hackathon", "winner", "runner up", "volunteer"
]

def extract_skills_from_text(text: str) -> Set[str]:
    """Finds all known skills and tech terms present in the given text."""
    text_lower = f" {text.lower()} "
    found_skills = set()
    
    for canonical, variations in SKILL_SYNONYMS.items():
        for var in variations:
            # Word boundary regex to avoid partial substring matching (e.g. 'c' in 'candidate')
            pattern = rf'(?:^|[\s,.\-()/;:\[\]]){re.escape(var)}(?:$|[\s,.\-()/;:\[\]])'
            if re.search(pattern, text_lower):
                found_skills.add(canonical)
                break
                
    return found_skills

def extract_evidence_snippets(raw_text: str, target_skills: Set[str]) -> List[Dict[str, str]]:
    """
    Finds real sentence excerpts from the resume that demonstrate evidence of the target skill.
    """
    sentences = re.split(r'(?<=[.!?\n])\s+', raw_text)
    snippets = []
    seen_skills = set()
    
    for sentence in sentences:
        clean_sentence = sentence.strip()
        if len(clean_sentence) < 20 or len(clean_sentence) > 300:
            continue
            
        sentence_lower = clean_sentence.lower()
        for skill in target_skills:
            if skill in seen_skills:
                continue
            variations = SKILL_SYNONYMS.get(skill, [skill])
            for var in variations:
                pattern = rf'(?:^|[\s,.\-()/;:\[\]]){re.escape(var)}(?:$|[\s,.\-()/;:\[\]])'
                if re.search(pattern, f" {sentence_lower} "):
                    # Determine section context
                    section = "Experience / Project"
                    if any(edu in sentence_lower for edu in ["college", "university", "school", "cgpa", "degree", "b.tech"]):
                        section = "Education"
                    elif any(cert in sentence_lower for cert in ["certified", "coursera", "udemy", "course"]):
                        section = "Certification"
                        
                    snippets.append({
                        "skill": skill.title(),
                        "snippet": clean_sentence,
                        "section": section
                    })
                    seen_skills.add(skill)
                    break
                    
    return snippets[:10]  # Return top 10 relevant evidence points

def detect_fresher_highlights(raw_text: str) -> List[str]:
    """
    Extracts explicit fresher achievements: capstone projects, internships, certifications, and portfolio repos.
    """
    text_lower = raw_text.lower()
    highlights = []
    
    # Check for Academic Projects
    project_matches = re.findall(
        r'(?:project[s]?:|final year project|capstone project|academic project)[^\n.]{10,120}',
        text_lower,
        re.IGNORECASE
    )
    for m in project_matches[:2]:
        highlights.append(f"Project: {m.strip().capitalize()}")
        
    # Check for Internships
    intern_matches = re.findall(
        r'(?:intern(?:ship)?|summer trainee)[^\n.]{10,100}',
        text_lower,
        re.IGNORECASE
    )
    for m in intern_matches[:2]:
        highlights.append(f"Internship Experience: {m.strip().capitalize()}")
        
    # Check for Certifications
    cert_matches = re.findall(
        r'(?:certified|certification|certificate in)[^\n.]{10,100}',
        text_lower,
        re.IGNORECASE
    )
    for m in cert_matches[:2]:
        highlights.append(f"Certification: {m.strip().capitalize()}")
        
    # Check for GitHub / Coding Profiles
    if "github.com" in text_lower:
        highlights.append("Active GitHub Repository / Code Portfolio link detected")
    if any(plat in text_lower for plat in ["leetcode", "hackerrank", "codeforces", "kaggle"]):
        highlights.append("Competitive Programming / Data Science profile detected")
        
    if not highlights:
        highlights.append("Candidate has foundational academic curriculum coursework")
        
    return list(dict.fromkeys(highlights))[:5]

def evaluate_resume_match(
    resume_text: str,
    job_title: str,
    job_description: str,
    explicit_required_skills: List[str] = None,
    experience_level: str = "Entry / Fresher",
    is_fresher_friendly: bool = True,
    min_education: str = "Bachelor's Degree",
) -> Dict[str, Any]:
    """
    Deterministic, explainable, evidence-based job matching algorithm.
    Evaluates:
      - Technical Skills Alignment
      - Experience / Project Alignment (with Fresher-friendly weighting)
      - Education & Foundational Competency
    Generates transparent scores, evidence quotes, and clear skill-gap analysis.
    """
    resume_text_lower = resume_text.lower()
    
    # 1. Determine Target Required Skills
    job_extracted_skills = extract_skills_from_text(f"{job_title} {job_description}")
    user_skills = {s.lower().strip() for s in (explicit_required_skills or []) if s.strip()}
    all_required_skills = job_extracted_skills | user_skills
    
    if not all_required_skills:
        # Fallback to key baseline skills if job description is short
        all_required_skills = {"python", "sql", "git", "rest api"}
        
    # 2. Extract Skills Found in Candidate's Resume
    resume_skills = extract_skills_from_text(resume_text)
    
    # 3. Categorize Skills (Matching vs Missing Evidence vs Confirmed Gaps)
    matching_skills = sorted(list(all_required_skills & resume_skills))
    missing_evidence = sorted(list(all_required_skills - resume_skills))
    
    # 4. Extract Real Evidence Snippets
    evidence_snippets = extract_evidence_snippets(resume_text, set(matching_skills))
    
    # 5. Extract Fresher Highlights
    fresher_highlights = detect_fresher_highlights(resume_text)
    
    # 6. Compute Technical Alignment Score (0 - 100)
    match_ratio = len(matching_skills) / max(len(all_required_skills), 1)
    technical_score = round(min(match_ratio * 100, 100.0), 1)
    
    # Bonus points for additional relevant skills beyond required list
    extra_skills = resume_skills - all_required_skills
    if extra_skills:
        technical_score = min(round(technical_score + min(len(extra_skills) * 2.5, 10.0), 1), 100.0)
        
    # 7. Compute Project & Experience Alignment Score (0 - 100)
    has_internship = any("intern" in h.lower() for h in fresher_highlights)
    has_projects = any("project" in h.lower() for h in fresher_highlights)
    has_repo = any("github" in h.lower() or "portfolio" in h.lower() for h in fresher_highlights)
    has_cert = any("certification" in h.lower() for h in fresher_highlights)
    
    if is_fresher_friendly or "fresher" in experience_level.lower() or "entry" in experience_level.lower():
        # Fresher-friendly scoring: Highly values projects, internships, GitHub, and certs
        proj_base = 50.0  # Base for candidate completing relevant degree
        if has_projects:
            proj_base += 20.0
        if has_internship:
            proj_base += 15.0
        if has_repo:
            proj_base += 10.0
        if has_cert:
            proj_base += 5.0
        experience_project_score = min(round(proj_base, 1), 100.0)
    else:
        # Experienced role: expects work tenure keywords
        exp_matches = re.findall(r'(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience', resume_text_lower)
        if exp_matches:
            years_found = max([int(y) for y in exp_matches if y.isdigit()] or [1])
            experience_project_score = min(round(years_found * 20.0 + (15.0 if has_projects else 0.0), 1), 100.0)
        else:
            experience_project_score = 60.0 if (has_internship or has_projects) else 40.0

    # 8. Compute Education & Foundation Alignment (0 - 100)
    has_bachelor = any(re.search(rf'\b{re.escape(k)}\b', resume_text_lower) for k in EDUCATION_KEYWORDS["bachelor"])
    has_master = any(re.search(rf'\b{re.escape(k)}\b', resume_text_lower) for k in EDUCATION_KEYWORDS["master"])
    has_cs_field = any(re.search(rf'\b{re.escape(k)}\b', resume_text_lower) for k in EDUCATION_KEYWORDS["fields"])
    
    edu_score = 50.0
    if has_bachelor or has_master:
        edu_score += 30.0
    if has_cs_field:
        edu_score += 20.0
    education_score = min(round(edu_score, 1), 100.0)
    
    # 9. Compute Overall Match Score
    # Weightings: 50% Technical, 35% Projects/Experience, 15% Education
    overall_score = round(
        (technical_score * 0.50) +
        (experience_project_score * 0.35) +
        (education_score * 0.15),
        1
    )
    
    # 10. Identify Confirmed Gaps vs Missing Evidence
    confirmed_gaps = []
    if "senior" in experience_level.lower() and (is_fresher_friendly or has_internship):
        confirmed_gaps.append("Senior role demands 5+ years commercial leadership; candidate profile shows entry-level/internship background.")
    if min_education.lower().startswith("master") and not has_master:
        confirmed_gaps.append(f"Job requisites specify {min_education}; resume documents Bachelor-level qualification.")
    if technical_score < 40.0:
        confirmed_gaps.append(f"Significant technical mismatch: only {len(matching_skills)} of {len(all_required_skills)} required technical core competencies detected.")

    # 11. Generate Transparent, Explainable Narrative Summary
    matched_skills_str = ", ".join([s.title() for s in matching_skills]) if matching_skills else "None"
    missing_skills_str = ", ".join([s.title() for s in missing_evidence]) if missing_evidence else "None"
    
    fresher_note = ""
    if is_fresher_friendly:
        fresher_note = f" Fresher-friendly weighting applied: candidate received recognition for practical projects and technical assets ({len(fresher_highlights)} items identified)."
        
    explanation = (
        f"Awarded overall fit score of {overall_score}% based on {len(matching_skills)}/{len(all_required_skills)} "
        f"verified technical skill matches ({matched_skills_str}). Technical alignment evaluated at {technical_score}%, "
        f"project & practical competency at {experience_project_score}%, and educational foundation at {education_score}%.{fresher_note} "
        f"Key missing evidence to probe during technical interview: {missing_skills_str}."
    )

    return {
        "match_score": overall_score,
        "score_breakdown": {
            "technical_score": technical_score,
            "experience_project_score": experience_project_score,
            "education_score": education_score,
            "overall_score": overall_score,
        },
        "matching_skills": [s.title() for s in matching_skills],
        "missing_evidence": [s.title() for s in missing_evidence],
        "confirmed_gaps": confirmed_gaps,
        "evidence_snippets": evidence_snippets,
        "fresher_highlights": fresher_highlights,
        "explanation": explanation,
    }
