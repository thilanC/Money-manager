# Money Manager Ledger (Starter Web App)

This is a lightweight ledger-style app for:
- Fixed and non-fixed income (salary, freelance)
- Fixed and non-fixed expenses (rent, insurance, grocery)
- Lending ledger (loan given + repayment tracking)
- Main account and sub-accounts (including bank account assets)
- Suggestions (LLM-style heuristics)
- Receipt text parsing for auto expense entry under a shop account

## Run

No dependency install needed.

```bash
python3 -m http.server 8000
```

Open: `http://localhost:8000`

## Files
- `index.html` — UI layout and forms
- `styles.css` — styling
- `app.js` — localStorage data model, transaction logic, loan ledger, suggestions, receipt parser

## Notes
- Data is saved in browser `localStorage`.
- Receipt scan currently supports `.txt` files.
- Next upgrades: image OCR, real LLM integrations, multi-user auth, and backend database.
