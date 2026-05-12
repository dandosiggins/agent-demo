# Agent Demo

HSS AI Hub demo — agentic AI morning briefing emailer.
Live at: https://agent-demo.davidlarsen.ca
Deployed to: Railway (separate project from RAG Demo)

## Architecture
- **Language:** Python
- **Entry point:** ai_briefing_agent.py
- **AI:** Anthropic Claude API with web_search tool
- **Email:** Gmail SMTP (HTML email output)
- **Mode:** Autonomous agent — conducts 5-8 web searches per run, decides its own research strategy

## How it works
1. Python gives Claude a goal: "research and write the briefing"
2. Claude autonomously decides what to search
3. Claude loops until satisfied (typically 5-8 searches)
4. Python builds HTML email from Claude's structured JSON output
5. Email sent via Gmail SMTP to configured recipients

## Environment Variables
- ANTHROPIC_API_KEY
- GMAIL_USERNAME
- GMAIL_APP_PASSWORD
- EMAIL_RECIPIENTS

## Rules
- Do not modify Railway config files
- Entry point is ai_briefing_agent.py — do not rename it
- Email template styling is intentional (dark theme, HSS AI Hub branding)
