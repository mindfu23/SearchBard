# Legacy Files - Not Part of Active Application

## Overview

The SearchBard project root contains several files from earlier development iterations. These files are **not used** by the current React application and are kept for historical reference only.

## Legacy Files

### searchBard.py

**Status**: Deprecated prototype  
**Location**: `/SearchBard/searchBard.py`

**What it is**:
An early Python prototype exploring the concept of aggregating conference/job search data. Contains stub functions with placeholder comments.

**Code snippet**:
```python
do sendRequest(companies, jobTitle):
	#text

do parseReturn(webtext):
	#text

do formatResults(returnedText):

do outputPage(stuff):
	print("got here")
	print(stuff)
```

**Why it exists**:
Initial exploration of the project idea before deciding on React/TypeScript implementation.

**Action**: Can be safely deleted. Not referenced by any active code.

---

### search.html

**Status**: Deprecated experiment  
**Location**: `/SearchBard/search.html`

**What it is**:
An HTML prototype using the Indeed Jobs API to test job search functionality. Includes jQuery templates and Indeed API integration.

**Key features attempted**:
- Indeed API job search integration
- jQuery templating for results
- Google Analytics tracking
- Basic search form

**Why it exists**:
Early experiment to test the viability of job/conference search UIs and API integrations.

**Why it's not used**:
- Project pivoted from job search to conference search
- Indeed API integration was replaced with SerpAPI + Ticketmaster
- jQuery approach was replaced with React
- Single HTML file doesn't scale for complex applications

**Action**: Can be safely deleted. Not referenced by any active code.

---

### requirements.txt

**Status**: Deprecated  
**Location**: `/SearchBard/requirements.txt`

**What it is**:
Installation instructions for Python virtualenv setup, related to the `searchBard.py` prototype.

**Content**:
```bash
$ sudo apt update
$ sudo apt install virtualenv
$ cd ~/git/wayofnumbers.github.io/
$ virtualenv venv -p python3.6
$ source venv/bin/activate
```

**Why it exists**:
Documentation for setting up the Python environment for the early prototype.

**Action**: Can be safely deleted. Current application uses npm/Node.js, not Python.

---

### README_v2.md

**Status**: Placeholder  
**Location**: `/SearchBard/README_v2.md`

**Content**:
```markdown
Initial attempt to revamp / work on this file with copilot. 
Saving this Readme under a different name in case that led to difficulties.
```

**What it is**:
A backup README file created during documentation updates. Contains only a single note about the process.

**Why it exists**:
Safety backup during README revision. Kept in case original README needed to be restored.

**Action**: Can be safely deleted now that comprehensive README.md exists.

---

## Active Application Location

**All active code is in**: `/SearchBard/conference-search/`

This is a Create React App project with:
- Modern React 18 with TypeScript
- Multiple API integrations (SerpAPI, Ticketmaster, Eventbrite)
- Comprehensive service layer
- Type-safe codebase
- Production-ready build system

See `/SearchBard/README.md` for complete documentation.

## Why Keep Legacy Files?

**Historical context**: Understanding project evolution
**Reference**: May contain ideas for future features  
**Backup**: Safety against accidental deletion of working code

## When to Delete

You can safely delete these legacy files when:
1. Current application is stable and deployed
2. No longer need historical reference
3. Want to clean up repository

**Recommendation**: Archive them in a separate branch before deletion:

```bash
cd /path/to/SearchBard
git checkout -b archive/legacy-files
git add searchBard.py search.html requirements.txt README_v2.md
git commit -m "Archive legacy prototype files"
git checkout main
git rm searchBard.py search.html requirements.txt README_v2.md
git commit -m "Remove legacy files (archived in archive/legacy-files branch)"
```

This preserves history while cleaning up the main branch.

---

**Last Updated**: December 4, 2025
