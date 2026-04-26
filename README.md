# 📋 Scenario-Based Documentation Training
### Sanni Day Residential Group — Level III Residential Group Home

[![Live Site](https://img.shields.io/badge/Live%20Site-GitHub%20Pages-blue?style=flat-square&logo=github)](https://olatmm.github.io/sdrg-documentation-training/)
[![Version](https://img.shields.io/badge/Version-1.0.0-green?style=flat-square)](https://github.com/olatmm/sdrg-documentation-training/releases/tag/v1.0.0)
[![License](https://img.shields.io/badge/Use-Internal%20Only-red?style=flat-square)]()

> An interactive, browser-based staff training platform for Level III residential group home professionals. Staff work through 11 realistic residential scenarios, write professional shift notes, and receive instant AI-powered rubric feedback — all from any device, no login required.

---

## 🌐 Live Site

**[https://olatmm.github.io/sdrg-documentation-training/](https://olatmm.github.io/sdrg-documentation-training/)**

Share this link with staff directly or add it to Connecteam via **Courses → Link** or **Knowledge Base → Link**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙 **Dual Instructor Voices** | Staff choose Alex (male) or Sarah (female) — ElevenLabs TTS v3 narration |
| 📋 **11 Scenarios** | Covers the full range of Level III residential situations |
| 🤖 **AI Rubric Grading** | Instant scoring across 5 clinical categories, 8/10 pass mark |
| 💬 **Trainer Follow-Up** | 5 clinical discussion questions + advanced challenge per scenario |
| 💾 **Save & Resume** | Staff save progress and return to exactly where they stopped |
| ✍️ **Digital Acknowledgment** | Signature canvas + 3 acknowledgment statements |
| 📄 **PDF Certificate** | Landscape certificate generated in-browser, downloadable |
| 📧 **Auto-Email** | Completion certificate emailed to admin on submission |

---

## 📚 The 11 Scenarios

| # | Scenario | Clinical Focus |
|---|---|---|
| 1 | Emotional Dysregulation After School | De-escalation, coping skills, peer conflict |
| 2 | Refusal to Shower | Hygiene compliance, motivational strategies |
| 3 | Argument Over Phone Privileges | Limit-setting, frustration tolerance |
| 4 | Theft From a Peer | Peer boundaries, impulse control |
| 5 | Running Away Threats | Elopement protocol, safety planning |
| 6 | Staff Shift Manipulation | Objective language, shift documentation integrity |
| 7 | Bedtime Defiance | Structured routines, limit-setting |
| 8 | Peer Bullying | Conflict intervention, peer respect |
| 9 | Panic Attack | Anxiety response, grounding techniques |
| 10 | Family Call Meltdown | Grief, abandonment response, emotional regulation |
| 11 | Excellent Progress Day | Documenting positive progress for treatment records |

---

## 🤖 Grading Rubric

Each submitted note is scored across **5 clinical categories (2 points each = 10 total)**:

| Category | What It Measures |
|---|---|
| **Behavior Description** | Specific, observable, objective language about what was seen |
| **Staff Interventions** | Named techniques — de-escalation, limit-setting, coping prompts |
| **Resident Response** | How resident reacted to each intervention |
| **Professional Language** | Clinical tone; absence of vague or judgmental wording |
| **Progress / Continued Needs** | Treatment relevance; connecting the incident to goals |

**Pass mark: 8/10.** Staff who score below 8 receive written feedback and can revise and resubmit.

---

## 🗂 File Structure

```
sdrg-documentation-training/
├── index.html            # All screens: voice select, intro, scenarios, follow-up, ack, certificate
├── style.css             # Full design system (SDRG red/gold theme, responsive)
├── app.js                # All logic: grading engine, scenarios data, PDF, email, save/resume
├── logo.png              # SDRG logo (transparent background)
├── narration_alex.mp3    # Alex instructor narration (ElevenLabs Brian voice)
└── narration_sarah.mp3   # Sarah instructor narration (ElevenLabs Matilda voice)
```

---

## ⚙️ Configuration

### Email Notifications (Optional)
When a staff member completes the training, the site can automatically email a completion notification to the admin inbox. This requires a free [EmailJS](https://www.emailjs.com) account.

1. Create a free account at [emailjs.com](https://www.emailjs.com)
2. Add your email service and name it `service_sdrg_fire`
3. Create an email template and name it `template_sdrg_cert`
   - Template variables: `{{staff_name}}`, `{{staff_title}}`, `{{comp_date}}`, `{{quiz_score}}`, `{{instructor}}`, `{{facility}}`
4. Copy your **Public Key** from the EmailJS dashboard
5. Open `app.js` and replace line 10:

```js
const EJS_PUBLIC = 'YOUR_EMAILJS_PUBLIC_KEY';
```

Emails will be sent to `admin@sannidayresidential.org` automatically on each completion.

---

## 🚀 Deploying Updates

To push changes to the live site:

```bash
# Make your edits locally, then:
git add .
git commit -m "describe your changes here"
git push origin main
```

GitHub Pages rebuilds automatically — changes go live within 1–2 minutes.

---

## 🏥 Organization

| | |
|---|---|
| **Organization** | Sanni Day Residential Group |
| **Facility Type** | Level III Residential Group Home |
| **Address** | 1312 Lineberger Ave, Gastonia, NC 28052 |
| **Director** | Ashley K. Sanni — 980-248-9079 |
| **QP** | Ajibola Sanni — 704-999-3674 |
| **Admin Email** | admin@sannidayresidential.org |

---

## 🛠 Tech Stack

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Audio | ElevenLabs TTS v3 |
| PDF Generation | [pdf-lib](https://pdf-lib.js.org/) v1.17.1 |
| Email | [EmailJS](https://www.emailjs.com) REST API |
| Fonts | DM Sans + DM Serif Display (Google Fonts) |
| Storage | localStorage (save/resume) |
| Hosting | GitHub Pages |

---

## 📄 License

This training content and codebase is intended for **internal use only** by Sanni Day Residential Group staff and administration. Not for redistribution.
